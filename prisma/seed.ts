import { PrismaClient, UserRole, AppointmentStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  // Criar usuário administrador
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12)
  
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || 'admin@barbearia.com' },
    update: {},
    create: {
      email: process.env.ADMIN_EMAIL || 'admin@barbearia.com',
      name: 'Administrador',
      password: hashedPassword,
      role: UserRole.ADMIN,
    },
  })

  console.log('✅ Usuário administrador criado:', admin.email)

  // Criar clientes de exemplo
  const clients = await Promise.all([
    prisma.client.upsert({
      where: { id: '507f1f77bcf86cd799439011' },
      update: {},
      create: {
        id: '507f1f77bcf86cd799439011',
        name: 'João Silva',
        phone: '11999887766',
        email: 'joao@email.com',
      },
    }),
    prisma.client.upsert({
      where: { id: '507f1f77bcf86cd799439012' },
      update: {},
      create: {
        id: '507f1f77bcf86cd799439012',
        name: 'Maria Santos',
        phone: '11988776655',
        email: 'maria@email.com',
      },
    }),
    prisma.client.upsert({
      where: { id: '507f1f77bcf86cd799439013' },
      update: {},
      create: {
        id: '507f1f77bcf86cd799439013',
        name: 'Pedro Oliveira',
        phone: '11977665544',
        email: 'pedro@email.com',
      },
    }),
    prisma.client.upsert({
      where: { id: '507f1f77bcf86cd799439014' },
      update: {},
      create: {
        id: '507f1f77bcf86cd799439014',
        name: 'Ana Costa',
        phone: '11966554433',
        email: 'ana@email.com',
      },
    }),
    prisma.client.upsert({
      where: { id: '507f1f77bcf86cd799439015' },
      update: {},
      create: {
        id: '507f1f77bcf86cd799439015',
        name: 'Carlos Ferreira',
        phone: '11955443322',
      },
    }),
    prisma.client.upsert({
      where: { id: '507f1f77bcf86cd799439016' },
      update: {},
      create: {
        id: '507f1f77bcf86cd799439016',
        name: 'Lucia Mendes',
        phone: '11944332211',
        email: 'lucia@email.com',
      },
    }),
  ])

  console.log('✅ Clientes criados:', clients.length)

  // Criar agendamentos de exemplo
  const appointments = await Promise.all([
    prisma.appointment.upsert({
      where: { id: '507f1f77bcf86cd799439021' },
      update: {},
      create: {
        id: '507f1f77bcf86cd799439021',
        clientId: clients[0].id,
        service: 'Corte de Cabelo',
        dateTime: new Date('2024-01-25T09:00:00Z'),
        status: AppointmentStatus.PENDING,
      },
    }),
    prisma.appointment.upsert({
      where: { id: '507f1f77bcf86cd799439022' },
      update: {},
      create: {
        id: '507f1f77bcf86cd799439022',
        clientId: clients[1].id,
        service: 'Corte + Barba',
        dateTime: new Date('2024-01-25T10:30:00Z'),
        status: AppointmentStatus.PENDING,
      },
    }),
    prisma.appointment.upsert({
      where: { id: '507f1f77bcf86cd799439023' },
      update: {},
      create: {
        id: '507f1f77bcf86cd799439023',
        clientId: clients[2].id,
        service: 'Corte de Cabelo',
        dateTime: new Date('2024-01-25T14:00:00Z'),
        status: AppointmentStatus.PENDING,
      },
    }),
    prisma.appointment.upsert({
      where: { id: '507f1f77bcf86cd799439024' },
      update: {},
      create: {
        id: '507f1f77bcf86cd799439024',
        clientId: clients[3].id,
        service: 'Corte + Barba + Bigode',
        dateTime: new Date('2024-01-24T09:00:00Z'),
        status: AppointmentStatus.COMPLETED,
      },
    }),
    prisma.appointment.upsert({
      where: { id: '507f1f77bcf86cd799439025' },
      update: {},
      create: {
        id: '507f1f77bcf86cd799439025',
        clientId: clients[4].id,
        service: 'Corte de Cabelo',
        dateTime: new Date('2024-01-24T10:30:00Z'),
        status: AppointmentStatus.COMPLETED,
      },
    }),
    prisma.appointment.upsert({
      where: { id: '507f1f77bcf86cd799439026' },
      update: {},
      create: {
        id: '507f1f77bcf86cd799439026',
        clientId: clients[5].id,
        service: 'Barba',
        dateTime: new Date('2024-01-24T14:00:00Z'),
        status: AppointmentStatus.COMPLETED,
      },
    }),
    prisma.appointment.upsert({
      where: { id: '507f1f77bcf86cd799439027' },
      update: {},
      create: {
        id: '507f1f77bcf86cd799439027',
        clientId: clients[0].id,
        service: 'Corte de Cabelo',
        dateTime: new Date('2024-01-23T09:00:00Z'),
        status: AppointmentStatus.CANCELLED,
      },
    }),
    prisma.appointment.upsert({
      where: { id: '507f1f77bcf86cd799439028' },
      update: {},
      create: {
        id: '507f1f77bcf86cd799439028',
        clientId: clients[1].id,
        service: 'Corte + Barba',
        dateTime: new Date('2024-01-23T15:30:00Z'),
        status: AppointmentStatus.CANCELLED,
      },
    }),
  ])

  console.log('✅ Agendamentos criados:', appointments.length)
  console.log('🎉 Seed concluído com sucesso!')
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
