import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, phone, email } = body

    // Validation
    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Nome e telefone são obrigatórios' },
        { status: 400 }
      )
    }

    // Check if phone already exists for another client
    const existingClient = await prisma.client.findFirst({
      where: {
        phone,
        id: { not: params.id }
      }
    })

    if (existingClient) {
      return NextResponse.json(
        { error: 'Já existe um cliente com este telefone' },
        { status: 400 }
      )
    }

    const client = await prisma.client.update({
      where: { id: params.id },
      data: {
        name,
        phone,
        email: email || null
      }
    })

    return NextResponse.json(client)
  } catch (error) {
    console.error('Error updating client:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if client has appointments
    const appointments = await prisma.appointment.findMany({
      where: { clientId: params.id }
    })

    if (appointments.length > 0) {
      return NextResponse.json(
        { error: 'Não é possível excluir cliente com agendamentos' },
        { status: 400 }
      )
    }

    await prisma.client.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Cliente excluído com sucesso' })
  } catch (error) {
    console.error('Error deleting client:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
