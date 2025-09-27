import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AppointmentStatus } from '@prisma/client'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status } = body

    // Validation
    if (!status || !Object.values(AppointmentStatus).includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido' },
        { status: 400 }
      )
    }

    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: { status },
      include: {
        client: true
      }
    })

    return NextResponse.json(appointment)
  } catch (error) {
    console.error('Error updating appointment status:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
