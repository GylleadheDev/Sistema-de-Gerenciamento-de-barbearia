'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { CheckCircle, XCircle, Clock, Calendar, User, Scissors, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDateTime, formatDate, formatTime } from '@/lib/utils'
import { api, handleApiError, AppointmentStatus as ApiAppointmentStatus } from '@/lib/api'

enum AppointmentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

interface Appointment {
  id: string
  dateTime: string
  service: string
  status: AppointmentStatus
  client: {
    id: string
    name: string
    phone: string
    email?: string
  }
  notes?: string
}

export default function AppointmentsPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<AppointmentStatus>(AppointmentStatus.PENDING)

  const fetchAppointments = async () => {
    try {
      setIsLoading(true)
      const response = await api.getAppointments({ status: activeTab })
      
      if (response.success && response.data) {
        setAppointments(response.data.appointments || [])
      } else {
        throw new Error(response.error || 'Erro ao carregar agendamentos')
      }
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error)
      toast.error(handleApiError(error))
      setAppointments([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  const updateAppointmentStatus = async (appointmentId: string, status: AppointmentStatus) => {
    try {
      const response = await api.updateAppointmentStatus(appointmentId, status)
      
      if (response.success) {
        // Atualizar o estado local
        setAppointments(prev => 
          prev.map(apt => apt.id === appointmentId ? { ...apt, status } : apt)
        )
        
        const statusText = status === AppointmentStatus.COMPLETED ? 'concluído' : 'cancelado'
        toast.success(`Agendamento ${statusText} com sucesso!`)
      } else {
        throw new Error(response.error || 'Erro ao atualizar agendamento')
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error(handleApiError(error))
    }
  }

  const getStatusIcon = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.PENDING:
        return <Clock className="h-4 w-4 text-yellow-500" />
      case AppointmentStatus.COMPLETED:
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case AppointmentStatus.CANCELLED:
        return <XCircle className="h-4 w-4 text-red-500" />
    }
  }

  const getStatusText = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.PENDING:
        return 'Pendente'
      case AppointmentStatus.COMPLETED:
        return 'Concluído'
      case AppointmentStatus.CANCELLED:
        return 'Cancelado'
    }
  }

  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case AppointmentStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800'
      case AppointmentStatus.COMPLETED:
        return 'bg-green-100 text-green-800'
      case AppointmentStatus.CANCELLED:
        return 'bg-red-100 text-red-800'
    }
  }

  const filteredAppointments = appointments.filter(apt => apt.status === activeTab)

  const tabs = [
    { value: AppointmentStatus.PENDING, label: 'Pendentes', count: appointments.filter(apt => apt.status === AppointmentStatus.PENDING).length },
    { value: AppointmentStatus.COMPLETED, label: 'Concluídos', count: appointments.filter(apt => apt.status === AppointmentStatus.COMPLETED).length },
    { value: AppointmentStatus.CANCELLED, label: 'Cancelados', count: appointments.filter(apt => apt.status === AppointmentStatus.CANCELLED).length },
  ]

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Carregando...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Agendamentos</h1>
            <p className="text-gray-600">Gerencie os agendamentos da barbearia</p>
          </div>
          <Button 
            onClick={() => router.push('/dashboard/agendamentos/novo')}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Novo Agendamento
          </Button>
        </div>

        <Tabs value={activeTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 text-xs sm:text-sm">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                active={activeTab === tab.value}
                onClick={() => setActiveTab(tab.value)}
                className="px-2 sm:px-3"
              >
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                <span className="ml-1">({tab.count})</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((tab) => (
            <TabsContent
              key={tab.value}
              value={tab.value}
              active={activeTab === tab.value}
              className="mt-6"
            >
              <div className="space-y-4">
                {filteredAppointments.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Nenhum agendamento {tab.label.toLowerCase()}</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="bg-white rounded-lg shadow border border-gray-200 p-4 sm:p-6"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 mb-3">
                              <div className="flex items-center space-x-2 mb-2 sm:mb-0">
                                <User className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                  {appointment.client.name}
                                </h3>
                              </div>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium w-fit ${getStatusColor(appointment.status)}`}>
                                {getStatusIcon(appointment.status)}
                                <span className="ml-1">{getStatusText(appointment.status)}</span>
                              </span>
                            </div>
                            
                            <div className="space-y-2 text-sm text-gray-600">
                              <div className="flex items-center space-x-2">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(new Date(appointment.dateTime))}</span>
                                <span className="hidden sm:inline">•</span>
                                <span className="hidden sm:inline">{formatTime(new Date(appointment.dateTime))}</span>
                                <span className="sm:hidden block">{formatTime(new Date(appointment.dateTime))}</span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Scissors className="h-4 w-4" />
                                <span>{appointment.service}</span>
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <span>📞</span>
                                <span>{appointment.client.phone}</span>
                              </div>
                            </div>
                          </div>
                          
                          {appointment.status === AppointmentStatus.PENDING && (
                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-4 sm:mt-0 sm:ml-4">
                              <Button
                                size="sm"
                                onClick={() => updateAppointmentStatus(appointment.id, AppointmentStatus.COMPLETED)}
                                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Concluir</span>
                                <span className="sm:hidden">✓</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateAppointmentStatus(appointment.id, AppointmentStatus.CANCELLED)}
                                className="w-full sm:w-auto"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                <span className="hidden sm:inline">Cancelar</span>
                                <span className="sm:hidden">✕</span>
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
