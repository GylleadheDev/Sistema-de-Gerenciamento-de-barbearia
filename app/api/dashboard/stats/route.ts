import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { handleApiError, createSuccessResponse, AppError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      throw new AppError('Não autorizado', 401, 'UNAUTHORIZED')
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month' // day, week, month, year

    // Calcular datas baseado no período
    const now = new Date()
    let startDate: Date

    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    // Buscar estatísticas em paralelo para melhor performance
    const [
      totalClients,
      totalAppointments,
      pendingAppointments,
      completedAppointments,
      cancelledAppointments,
      recentAppointments,
      topServices
    ] = await Promise.all([
      // Total de clientes
      prisma.client.count(),
      
      // Total de agendamentos (todos)
      prisma.appointment.count(),
      
      // Agendamentos pendentes (todos)
      prisma.appointment.count({
        where: {
          status: 'PENDING'
        }
      }),
      
      // Agendamentos concluídos (todos)
      prisma.appointment.count({
        where: {
          status: 'COMPLETED'
        }
      }),
      
      // Agendamentos cancelados (todos)
      prisma.appointment.count({
        where: {
          status: 'CANCELLED'
        }
      }),
      
      // Próximos agendamentos (próximos 7 dias)
      prisma.appointment.findMany({
        where: {
          dateTime: {
            gte: now,
            lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
          },
          status: 'PENDING'
        },
        orderBy: { dateTime: 'asc' },
        take: 5,
        include: {
          client: {
            select: {
              name: true,
              phone: true
            }
          }
        }
      }),
      
      // Serviços mais populares (baseado no período selecionado)
      prisma.appointment.groupBy({
        by: ['service'],
        where: {
          dateTime: {
            gte: startDate
          },
          status: 'COMPLETED'
        },
        _count: {
          service: true
        },
        orderBy: {
          _count: {
            service: 'desc'
          }
        },
        take: 5
      })
    ])

    // Calcular taxas de performance
    const completionRate = totalAppointments > 0 
      ? Math.round((completedAppointments / totalAppointments) * 100)
      : 0

    const cancellationRate = totalAppointments > 0 
      ? Math.round((cancelledAppointments / totalAppointments) * 100)
      : 0

    // Buscar dados para o gráfico mensal (últimos 6 meses)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const monthlyData = await prisma.appointment.findMany({
      where: {
        dateTime: {
          gte: sixMonthsAgo
        }
      },
      select: {
        dateTime: true,
        status: true
      }
    })

    // Processar estatísticas mensais
    const monthlyStats = monthlyData.reduce((acc: any, appointment: any) => {
      const month = appointment.dateTime.toISOString().substring(0, 7) // YYYY-MM
      if (!acc[month]) {
        acc[month] = { total: 0, completed: 0, cancelled: 0, pending: 0 }
      }
      acc[month].total++
      if (appointment.status === 'COMPLETED') acc[month].completed++
      if (appointment.status === 'CANCELLED') acc[month].cancelled++
      if (appointment.status === 'PENDING') acc[month].pending++
      return acc
    }, {})

    const stats = {
      overview: {
        totalClients,
        totalAppointments,
        pendingAppointments,
        completedAppointments,
        cancelledAppointments,
        completionRate,
        cancellationRate,
      },
      recentAppointments: recentAppointments.map(appointment => ({
        id: appointment.id,
        client: appointment.client,
        service: appointment.service,
        dateTime: appointment.dateTime,
        status: appointment.status
      })),
      topServices: topServices.map(service => ({
        service: service.service,
        count: service._count.service
      })),
      monthlyStats,
      period,
      generatedAt: new Date().toISOString()
    }

    return createSuccessResponse(stats)
  } catch (error) {
    return handleApiError(error)
  }
}
