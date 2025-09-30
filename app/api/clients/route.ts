import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { clientSchema, paginationSchema } from '@/lib/validations'
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

    const { page, limit, search } = paginationParams
    const skip = (page - 1) * limit

    // Construir where clause para busca
    const where = search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' as const } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ]
    } : {}

    // Buscar clientes e total em paralelo
    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          appointments: {
            select: {
              id: true,
              status: true,
              dateTime: true,
              service: true,
            },
            orderBy: { dateTime: 'desc' },
            take: 5, // Últimos 5 agendamentos
          },
          _count: {
            select: {
              appointments: true,
            },
          },
        }
      }),
      prisma.client.count({ where })
    ])

    const totalPages = Math.ceil(total / limit)

    // Processar dados dos clientes
    const processedClients = clients.map(client => ({
      ...client,
      totalAppointments: client._count.appointments,
      lastAppointment: client.appointments[0] || null,
      pendingAppointments: client.appointments.filter(apt => apt.status === 'PENDING').length,
    }))

    return createSuccessResponse({
      clients: processedClients,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
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
    const validatedData = clientSchema.parse(body)

    // Verificar se já existe cliente com o mesmo telefone
    const existingClient = await prisma.client.findFirst({
      where: { phone: validatedData.phone }
    })

    if (existingClient) {
      throw new AppError('Já existe um cliente com este telefone', 409, 'CLIENT_EXISTS')
    }

    // Verificar se email já existe (se fornecido)
    if (validatedData.email) {
      const existingClientByEmail = await prisma.client.findFirst({
        where: { email: validatedData.email }
      })

      if (existingClientByEmail) {
        throw new AppError('Já existe um cliente com este email', 409, 'EMAIL_EXISTS')
      }
    }

    const client = await prisma.client.create({
      data: {
        ...validatedData,
        email: validatedData.email || undefined, // Converter string vazia para undefined
      },
      include: {
        _count: {
          select: {
            appointments: true,
          },
        },
      },
    })

    return createSuccessResponse(client, 'Cliente criado com sucesso')
  } catch (error) {
    return handleApiError(error)
  }
}
