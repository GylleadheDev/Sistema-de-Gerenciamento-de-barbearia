import { PrismaClient, UserRole, AppointmentStatus } from '@prisma/client'
import { hashPassword } from 'better-auth/crypto'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...')

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@barbearia.com'
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'

  // Better Auth guarda o hash da senha em `accounts.password` com
  // providerId "credential". A coluna `users.password` não existe mais,
  // então criar só o usuário não basta para o login funcionar.
  const hashedPassword = await hashPassword(adminPassword)

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: 'Administrador', role: UserRole.ADMIN, emailVerified: true },
    create: {
      email: adminEmail,
      name: 'Administrador',
      role: UserRole.ADMIN,
      emailVerified: true,
    },
  })

  // ⚠️ Para o provider "credential", `accountId` precisa ser o ID DO USUÁRIO,
  // não o e-mail. O Better Auth compara
  //   account.accountId === userRecord.user.id   (api/routes/sign-in.mjs)
  // Gravar o e-mail aqui faz o login falhar com "Invalid email or password"
  // mesmo com a senha correta, porque o `credentialAccount` nunca é encontrado.
  await prisma.account.deleteMany({
    where: {
      userId: admin.id,
      providerId: 'credential',
      accountId: { not: admin.id },
    },
  })

  await prisma.account.upsert({
    where: {
      providerId_accountId: { providerId: 'credential', accountId: admin.id },
    },
    update: { userId: admin.id, password: hashedPassword },
    create: {
      userId: admin.id,
      providerId: 'credential',
      accountId: admin.id,
      password: hashedPassword,
    },
  })

  console.log('✅ Usuário administrador criado:', admin.email)

  // Criar clientes de exemplo
  const clients = await Promise.all([
    prisma.client.upsert({
      where: { id: 'seed-client-01' },
      update: {},
      create: {
        id: 'seed-client-01',
        name: 'João Silva',
        phone: '11999887766',
        email: 'joao@email.com',
      },
    }),
    prisma.client.upsert({
      where: { id: 'seed-client-02' },
      update: {},
      create: {
        id: 'seed-client-02',
        name: 'Maria Santos',
        phone: '11988776655',
        email: 'maria@email.com',
      },
    }),
    prisma.client.upsert({
      where: { id: 'seed-client-03' },
      update: {},
      create: {
        id: 'seed-client-03',
        name: 'Pedro Oliveira',
        phone: '11977665544',
        email: 'pedro@email.com',
      },
    }),
    prisma.client.upsert({
      where: { id: 'seed-client-04' },
      update: {},
      create: {
        id: 'seed-client-04',
        name: 'Ana Costa',
        phone: '11966554433',
        email: 'ana@email.com',
      },
    }),
    prisma.client.upsert({
      where: { id: 'seed-client-05' },
      update: {},
      create: {
        id: 'seed-client-05',
        name: 'Carlos Ferreira',
        phone: '11955443322',
      },
    }),
    prisma.client.upsert({
      where: { id: 'seed-client-06' },
      update: {},
      create: {
        id: 'seed-client-06',
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
      where: { id: 'seed-appt-01' },
      update: {},
      create: {
        id: 'seed-appt-01',
        clientId: clients[0].id,
        service: 'Corte de Cabelo',
        dateTime: new Date('2024-01-25T09:00:00Z'),
        status: AppointmentStatus.PENDING,
      },
    }),
    prisma.appointment.upsert({
      where: { id: 'seed-appt-02' },
      update: {},
      create: {
        id: 'seed-appt-02',
        clientId: clients[1].id,
        service: 'Corte + Barba',
        dateTime: new Date('2024-01-25T10:30:00Z'),
        status: AppointmentStatus.PENDING,
      },
    }),
    prisma.appointment.upsert({
      where: { id: 'seed-appt-03' },
      update: {},
      create: {
        id: 'seed-appt-03',
        clientId: clients[2].id,
        service: 'Corte de Cabelo',
        dateTime: new Date('2024-01-25T14:00:00Z'),
        status: AppointmentStatus.PENDING,
      },
    }),
    prisma.appointment.upsert({
      where: { id: 'seed-appt-04' },
      update: {},
      create: {
        id: 'seed-appt-04',
        clientId: clients[3].id,
        service: 'Corte + Barba + Bigode',
        dateTime: new Date('2024-01-24T09:00:00Z'),
        status: AppointmentStatus.COMPLETED,
      },
    }),
    prisma.appointment.upsert({
      where: { id: 'seed-appt-05' },
      update: {},
      create: {
        id: 'seed-appt-05',
        clientId: clients[4].id,
        service: 'Corte de Cabelo',
        dateTime: new Date('2024-01-24T10:30:00Z'),
        status: AppointmentStatus.COMPLETED,
      },
    }),
    prisma.appointment.upsert({
      where: { id: 'seed-appt-06' },
      update: {},
      create: {
        id: 'seed-appt-06',
        clientId: clients[5].id,
        service: 'Barba',
        dateTime: new Date('2024-01-24T14:00:00Z'),
        status: AppointmentStatus.COMPLETED,
      },
    }),
    prisma.appointment.upsert({
      where: { id: 'seed-appt-07' },
      update: {},
      create: {
        id: 'seed-appt-07',
        clientId: clients[0].id,
        service: 'Corte de Cabelo',
        dateTime: new Date('2024-01-23T09:00:00Z'),
        status: AppointmentStatus.CANCELLED,
      },
    }),
    prisma.appointment.upsert({
      where: { id: 'seed-appt-08' },
      update: {},
      create: {
        id: 'seed-appt-08',
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
