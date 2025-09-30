import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { appointmentSchema, paginationSchema, appointmentFiltersSchema } from '@/lib/validations'
import { handleApiError, createSuccessResponse, AppError } from '@/lib/errors'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      throw new AppError('Não autorizado', 401, 'UNAUTHORIZED')
    }

    const { searchParams } = new URL(request.url)
    
    // Validar parâmetros de paginação
    const paginationParams = paginationSchema.parse({
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      search: searchParams.get('search') || undefined,
    })

    // Validar filtros específicos de agendamentos
    const filters = appointmentFiltersSchema.parse({
      status: searchParams.get('status') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
    })

    const { page, limit, search } = paginationParams
    const skip = (page - 1) * limit

    // Construir where clause
    const where: any = {}

    // Aplicar filtros de status
    if (filters.status) {
      where.status = filters.status
    }

    // Aplicar filtros de data
    if (filters.startDate || filters.endDate) {
      where.dateTime = {}
      if (filters.startDate) {
        where.dateTime.gte = new Date(filters.startDate)
      }
      if (filters.endDate) {
        where.dateTime.lte = new Date(filters.endDate)
      }
    }

    // Aplicar busca por cliente, serviço ou notas
    if (search) {
      where.OR = [
        { service: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        {
          client: {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search } },
              { email: { contains: search, mode: 'insensitive' } }
            ]
          }
        }
      ]
    }

    // Buscar agendamentos e total em paralelo
    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        orderBy: [
          { dateTime: 'desc' },
          { createdAt: 'desc' }
        ],
        include: {
          client: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
            }
          }
        }
      }),
      prisma.appointment.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    return createSuccessResponse({
      appointments,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
      filters: filters,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      throw new AppError('Não autorizado', 401, 'UNAUTHORIZED')
    }

    const body = await request.json()
    const validatedData = appointmentSchema.parse(body)

    // Verificar se cliente existe
    const client = await prisma.client.findUnique({
      where: { id: validatedData.clientId }
    })

    if (!client) {
      throw new AppError('Cliente não encontrado', 404, 'CLIENT_NOT_FOUND')
    }

    const appointmentDate = new Date(validatedData.dateTime)

    // Verificar se já existe agendamento no mesmo horário (com tolerância de 30 minutos)
    const toleranceMinutes = 30
    const startTime = new Date(appointmentDate.getTime() - toleranceMinutes * 60000)
    const endTime = new Date(appointmentDate.getTime() + toleranceMinutes * 60000)

    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        dateTime: {
          gte: startTime,
          lte: endTime
        },
        status: { not: 'CANCELLED' }
      },
      include: {
        client: {
          select: {
            name: true
          }
        }
      }
    })

    if (conflictingAppointment) {
      throw new AppError(
        `Já existe um agendamento próximo a este horário (${conflictingAppointment.client.name})`,
        409,
        'APPOINTMENT_CONFLICT'
      )
    }

    // Verificar horário comercial (8h às 18h)
    const hour = appointmentDate.getHours()
    if (hour < 8 || hour >= 18) {
      throw new AppError('Agendamentos apenas entre 8h e 18h', 400, 'INVALID_BUSINESS_HOURS')
    }

    // Verificar se não é domingo
    const dayOfWeek = appointmentDate.getDay()
    if (dayOfWeek === 0) {
      throw new AppError('Não atendemos aos domingos', 400, 'CLOSED_ON_SUNDAY')
    }

    const appointment = await prisma.appointment.create({
      data: {
        ...validatedData,
        dateTime: appointmentDate,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          }
        }
      }
    })

    return createSuccessResponse(appointment, 'Agendamento criado com sucesso')
  } catch (error) {
    return handleApiError(error)
  }
}
