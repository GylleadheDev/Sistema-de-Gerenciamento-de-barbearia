import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { handleApiError, createSuccessResponse, AppError } from '@/lib/errors'

// Marcar como rota dinâmica para evitar problemas no build
export const dynamic = 'force-dynamic'

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      throw new AppError('Não autorizado', 401, 'UNAUTHORIZED')
    }

    const body = await request.json()
    const { status } = updateStatusSchema.parse(body)

    // Verificar se agendamento existe
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: params.id }
    })

    if (!existingAppointment) {
      throw new AppError('Agendamento não encontrado', 404, 'APPOINTMENT_NOT_FOUND')
    }

    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: { status },
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

    const statusMessages = {
      PENDING: 'Agendamento marcado como pendente',
      COMPLETED: 'Agendamento concluído com sucesso',
      CANCELLED: 'Agendamento cancelado'
    }

    return createSuccessResponse(appointment, statusMessages[status])
  } catch (error) {
    return handleApiError(error)
  }
}
