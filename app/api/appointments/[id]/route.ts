import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateAppointmentSchema } from '@/lib/validations'
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

    const appointment = await prisma.appointment.findUnique({
      where: { id: params.id },
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

    if (!appointment) {
      throw new AppError('Agendamento não encontrado', 404, 'APPOINTMENT_NOT_FOUND')
    }

    return createSuccessResponse(appointment)
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
    const validatedData = updateAppointmentSchema.parse(body)

    // Verificar se agendamento existe
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: params.id }
    })

    if (!existingAppointment) {
      throw new AppError('Agendamento não encontrado', 404, 'APPOINTMENT_NOT_FOUND')
    }

    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: validatedData,
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

    return createSuccessResponse(appointment, 'Agendamento atualizado com sucesso')
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

    // Verificar se agendamento existe
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: params.id }
    })

    if (!existingAppointment) {
      throw new AppError('Agendamento não encontrado', 404, 'APPOINTMENT_NOT_FOUND')
    }

    // Verificar se não é um agendamento já concluído
    if (existingAppointment.status === 'COMPLETED') {
      throw new AppError('Não é possível excluir agendamento já concluído', 409, 'APPOINTMENT_COMPLETED')
    }

    await prisma.appointment.delete({
      where: { id: params.id }
    })

    return createSuccessResponse(null, 'Agendamento excluído com sucesso')
  } catch (error) {
    return handleApiError(error)
  }
}
