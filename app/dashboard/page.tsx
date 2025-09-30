'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Calendar, Users, CheckCircle, XCircle } from 'lucide-react'
import { api, handleApiError } from '@/lib/api'
import toast from 'react-hot-toast'

interface DashboardStats {
  overview: {
    totalClients: number
    totalAppointments: number
    pendingAppointments: number
    completedAppointments: number
    cancelledAppointments: number
    completionRate: number
    cancellationRate: number
  }
  recentAppointments: any[]
  topServices: any[]
  monthlyStats: any
  period: string
  generatedAt: string
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.getDashboardStats()
        
        if (response.success && response.data) {
          setData(response.data)
        } else {
          throw new Error(response.error || 'Erro ao carregar estatísticas')
        }
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error)
        toast.error(handleApiError(error))
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Carregando dados...</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
                <div className="p-4 sm:p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="p-2 sm:p-3 rounded-md bg-gray-200 h-10 w-10"></div>
                    </div>
                    <div className="ml-3 sm:ml-5 w-0 flex-1 min-w-0">
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!data) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Erro ao carregar dados</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const stats = [
    {
      name: 'Agendamentos Pendentes',
      value: data.overview.pendingAppointments,
      icon: Calendar,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      name: 'Agendamentos Concluídos',
      value: data.overview.completedAppointments,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      name: 'Agendamentos Cancelados',
      value: data.overview.cancelledAppointments,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      name: 'Total de Clientes',
      value: data.overview.totalClients,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    }
  ]

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Visão geral do sistema de agendamentos</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-4 sm:p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`p-2 sm:p-3 rounded-md ${stat.bgColor}`}>
                      <stat.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${stat.color}`} />
                    </div>
                  </div>
                  <div className="ml-3 sm:ml-5 w-0 flex-1 min-w-0">
                    <dl>
                      <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg sm:text-xl font-semibold text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Resumo dos Agendamentos
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-yellow-600">
                  {data.overview.pendingAppointments}
                </div>
                <div className="text-xs sm:text-sm text-gray-500">Pendentes</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  {data.overview.completedAppointments}
                </div>
                <div className="text-xs sm:text-sm text-gray-500">Concluídos</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-red-600">
                  {data.overview.cancelledAppointments}
                </div>
                <div className="text-xs sm:text-sm text-gray-500">Cancelados</div>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas adicionais */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Taxa de Conclusão
              </h3>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {data.overview.completionRate}%
                </div>
                <div className="text-sm text-gray-500">Agendamentos concluídos</div>
              </div>
            </div>
          </div>
          
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Taxa de Cancelamento
              </h3>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">
                  {data.overview.cancellationRate}%
                </div>
                <div className="text-sm text-gray-500">Agendamentos cancelados</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
