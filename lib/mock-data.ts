import { AppointmentStatus } from '@prisma/client'

export interface MockClient {
  id: string
  name: string
  phone: string
  email?: string
  createdAt: string
}

export interface MockAppointment {
  id: string
  dateTime: string
  service: string
  status: AppointmentStatus
  client: MockClient
}

export const mockClients: MockClient[] = [
  {
    id: '1',
    name: 'João Silva',
    phone: '11999887766',
    email: 'joao@email.com',
    createdAt: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    name: 'Maria Santos',
    phone: '11988776655',
    email: 'maria@email.com',
    createdAt: '2024-01-16T14:30:00Z'
  },
  {
    id: '3',
    name: 'Pedro Oliveira',
    phone: '11977665544',
    email: 'pedro@email.com',
    createdAt: '2024-01-17T09:15:00Z'
  },
  {
    id: '4',
    name: 'Ana Costa',
    phone: '11966554433',
    email: 'ana@email.com',
    createdAt: '2024-01-18T16:45:00Z'
  },
  {
    id: '5',
    name: 'Carlos Ferreira',
    phone: '11955443322',
    createdAt: '2024-01-19T11:20:00Z'
  },
  {
    id: '6',
    name: 'Lucia Mendes',
    phone: '11944332211',
    email: 'lucia@email.com',
    createdAt: '2024-01-20T13:10:00Z'
  }
]

export const mockAppointments: MockAppointment[] = [
  {
    id: '1',
    dateTime: '2024-01-25T09:00:00Z',
    service: 'Corte de Cabelo',
    status: AppointmentStatus.PENDING,
    client: mockClients[0]
  },
  {
    id: '2',
    dateTime: '2024-01-25T10:30:00Z',
    service: 'Corte + Barba',
    status: AppointmentStatus.PENDING,
    client: mockClients[1]
  },
  {
    id: '3',
    dateTime: '2024-01-25T14:00:00Z',
    service: 'Corte de Cabelo',
    status: AppointmentStatus.PENDING,
    client: mockClients[2]
  },
  {
    id: '4',
    dateTime: '2024-01-24T09:00:00Z',
    service: 'Corte + Barba + Bigode',
    status: AppointmentStatus.COMPLETED,
    client: mockClients[3]
  },
  {
    id: '5',
    dateTime: '2024-01-24T10:30:00Z',
    service: 'Corte de Cabelo',
    status: AppointmentStatus.COMPLETED,
    client: mockClients[4]
  },
  {
    id: '6',
    dateTime: '2024-01-24T14:00:00Z',
    service: 'Barba',
    status: AppointmentStatus.COMPLETED,
    client: mockClients[5]
  },
  {
    id: '7',
    dateTime: '2024-01-23T09:00:00Z',
    service: 'Corte de Cabelo',
    status: AppointmentStatus.CANCELLED,
    client: mockClients[0]
  },
  {
    id: '8',
    dateTime: '2024-01-23T15:30:00Z',
    service: 'Corte + Barba',
    status: AppointmentStatus.CANCELLED,
    client: mockClients[1]
  }
]

export const mockDashboardStats = {
  pendingAppointments: mockAppointments.filter(apt => apt.status === AppointmentStatus.PENDING).length,
  completedAppointments: mockAppointments.filter(apt => apt.status === AppointmentStatus.COMPLETED).length,
  cancelledAppointments: mockAppointments.filter(apt => apt.status === AppointmentStatus.CANCELLED).length,
  totalClients: mockClients.length
}
