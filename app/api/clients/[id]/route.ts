import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateClientSchema } from '@/lib/validations'
import { handleApiError, createSuccessResponse, AppError } from '@/lib/errors'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      throw new AppError('Não autorizado', 401, 'UNAUTHORIZED')
    }

    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        appointments: {
          orderBy: { dateTime: 'desc' },
          select: {
            id: true,
            service: true,
            dateTime: true,
            status: true,
            notes: true,
          }
        }
      }
    })

    if (!client) {
      throw new AppError('Cliente não encontrado', 404, 'CLIENT_NOT_FOUND')
    }

    return createSuccessResponse(client)
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      throw new AppError('Não autorizado', 401, 'UNAUTHORIZED')
    }

    const body = await request.json()
    const validatedData = updateClientSchema.parse(body)

    // Verificar se cliente existe
    const existingClient = await prisma.client.findUnique({
      where: { id: params.id }
    })

    if (!existingClient) {
      throw new AppError('Cliente não encontrado', 404, 'CLIENT_NOT_FOUND')
    }

    // Se está atualizando o telefone, verificar se não existe outro cliente com o mesmo telefone
    if (validatedData.phone && validatedData.phone !== existingClient.phone) {
      const clientWithSamePhone = await prisma.client.findFirst({
        where: { 
          phone: validatedData.phone,
          id: { not: params.id }
        }
      })

      if (clientWithSamePhone) {
        throw new AppError('Já existe um cliente com este telefone', 409, 'CLIENT_EXISTS')
      }
    }

    const client = await prisma.client.update({
      where: { id: params.id },
      data: validatedData,
    })

    return createSuccessResponse(client, 'Cliente atualizado com sucesso')
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      throw new AppError('Não autorizado', 401, 'UNAUTHORIZED')
    }

    // Verificar se cliente existe
    const existingClient = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        appointments: {
          where: {
            status: 'PENDING'
          }
        }
      }
    })

    if (!existingClient) {
      throw new AppError('Cliente não encontrado', 404, 'CLIENT_NOT_FOUND')
    }

    // Verificar se tem agendamentos pendentes
    if (existingClient.appointments.length > 0) {
      throw new AppError('Não é possível excluir cliente com agendamentos pendentes', 409, 'CLIENT_HAS_PENDING_APPOINTMENTS')
    }

    await prisma.client.delete({
      where: { id: params.id }
    })

    return createSuccessResponse(null, 'Cliente excluído com sucesso')
  } catch (error) {
    return handleApiError(error)
  }
}
