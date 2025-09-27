import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { AppointmentStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as AppointmentStatus | null

    const where = status ? { status } : {}

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        client: true
      },
      orderBy: { dateTime: 'asc' }
    })

    return NextResponse.json(appointments)
  } catch (error) {
    console.error('Error fetching appointments:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { dateTime, service, clientId } = body

    // Validation
    if (!dateTime || !service || !clientId) {
      return NextResponse.json(
        { error: 'Data, serviço e cliente são obrigatórios' },
        { status: 400 }
      )
    }

    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 400 }
      )
    }

    const appointment = await prisma.appointment.create({
      data: {
        dateTime: new Date(dateTime),
        service,
        clientId,
        status: AppointmentStatus.PENDING
      },
      include: {
        client: true
      }
    })

    return NextResponse.json(appointment, { status: 201 })
  } catch (error) {
    console.error('Error creating appointment:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
