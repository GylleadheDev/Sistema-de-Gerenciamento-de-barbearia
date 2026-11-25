"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  Scissors,
  Plus,
  DollarSign,
  ArrowUpRight,
  Phone,
} from "lucide-react"
import { api, handleApiError } from "@/lib/api"
import { formatCurrency, formatDate, formatTime, formatPhone } from "@/lib/utils"
import toast from "react-hot-toast"

interface DashboardStats {
  overview: {
    totalClients: number
    totalAppointments: number
    pendingAppointments: number
    completedAppointments: number
    cancelledAppointments: number
    completionRate: number
    cancellationRate: number
    estimatedRevenue: number
    pendingRevenue: number
  }
  recentAppointments: Array<{
    id: string
    service: string
    price: number
    duration: number
    dateTime: string
    status: string
    client?: {
      name: string
      phone: string
    }
  }>
  topServices: Array<{
    service: string
    count: number
    revenue: number
  }>
  period: string
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardStats | null>(null)
  const [period, setPeriod] = useState("month")
  const [loading, setLoading] = useState(true)

  const fetchStats = async (selectedPeriod: string) => {
    try {
      setLoading(true)
      const response = await api.getDashboardStats(selectedPeriod)
      if (response.success && response.data) {
        setData(response.data)
      } else {
        throw new Error(response.error || "Erro ao carregar estatísticas")
      }
    } catch (error) {
      toast.error(handleApiError(error))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats(period)
  }, [period])

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header section */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Badge variant="default" className="mb-2">
              Painel Executivo • Tempo Real
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Visão Geral da Barbearia
            </h1>
            <p className="text-sm text-zinc-400">
              Acompanhe métricas financeiras, desempenho de agendamentos e clientes ativos.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-zinc-800 bg-zinc-900 p-1">
              {[
                { id: "day", label: "Hoje" },
                { id: "week", label: "7 Dias" },
                { id: "month", label: "Mês" },
                { id: "year", label: "Ano" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPeriod(p.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    period === p.id
                      ? "bg-amber-500 text-zinc-950 font-semibold"
                      : "text-zinc-400 hover:text-zinc-100"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <Link href="/dashboard/agendamentos/novo">
              <Button>
                <Plus className="h-4 w-4" />
                Novo Agendamento
              </Button>
            </Link>
          </div>
        </div>

        {loading || !data ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="h-32 animate-pulse bg-zinc-900/40" />
            ))}
          </div>
        ) : (
          <>
            {/* KPI Metric Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="relative overflow-hidden border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-zinc-900/80 to-zinc-900">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-amber-400">
                      Receita Realizada
                    </span>
                    <div className="rounded-lg bg-amber-500/20 p-2 text-amber-400">
                      <DollarSign className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 text-2xl font-bold text-white">
                    {formatCurrency(data.overview.estimatedRevenue)}
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">
                    + {formatCurrency(data.overview.pendingRevenue)} previstos na fila
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                      Horários Pendentes
                    </span>
                    <div className="rounded-lg bg-amber-500/15 p-2 text-amber-400">
                      <Clock className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 text-2xl font-bold text-white">
                    {data.overview.pendingAppointments}
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">
                    De {data.overview.totalAppointments} agendamentos totais
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                      Concluídos & Eficiência
                    </span>
                    <div className="rounded-lg bg-emerald-500/15 p-2 text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">
                      {data.overview.completedAppointments}
                    </span>
                    <Badge variant="success">{data.overview.completionRate}% conclusão</Badge>
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">
                    Cancelamentos: {data.overview.cancellationRate}% ({data.overview.cancelledAppointments})
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-zinc-400">
                      Base de Clientes
                    </span>
                    <div className="rounded-lg bg-sky-500/15 p-2 text-sky-400">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="mt-3 text-2xl font-bold text-white">
                    {data.overview.totalClients}
                  </div>
                  <p className="mt-1 text-xs text-zinc-400">
                    Clientes cadastrados e ativos
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Main Grid: Upcoming Appointments & Top Services */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between pb-4">
                  <div>
                    <CardTitle>Próximos Atendimentos</CardTitle>
                    <CardDescription>
                      Clientes aguardando atendimento nos próximos dias
                    </CardDescription>
                  </div>
                  <Link href="/dashboard/agendamentos">
                    <Button variant="outline" size="sm">
                      Ver Agenda
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  {data.recentAppointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-800 py-12 text-center">
                      <Calendar className="h-10 w-10 text-zinc-600" />
                      <p className="mt-2 text-sm font-medium text-zinc-300">
                        Nenhum atendimento pendente para os próximos dias
                      </p>
                      <Link href="/dashboard/agendamentos/novo" className="mt-3">
                        <Button size="sm" variant="outline">
                          Agendar Cliente
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data.recentAppointments.map((apt) => (
                        <div
                          key={apt.id}
                          className="flex flex-col justify-between gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-4 transition-colors hover:border-zinc-700 sm:flex-row sm:items-center"
                        >
                          <div className="flex items-start gap-3.5">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/15 font-bold text-amber-400">
                              {apt.client?.name?.charAt(0).toUpperCase() || "C"}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-zinc-100">
                                  {apt.client?.name || "Cliente"}
                                </p>
                                <Badge variant="warning">Pendente</Badge>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
                                <span className="inline-flex items-center gap-1 text-amber-400/90">
                                  <Scissors className="h-3.5 w-3.5" />
                                  {apt.service}
                                </span>
                                {apt.client?.phone && (
                                  <span className="inline-flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    {formatPhone(apt.client.phone)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-zinc-800/60 pt-2 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                            <span className="text-sm font-semibold text-zinc-100">
                              {formatDate(new Date(apt.dateTime))} • {formatTime(new Date(apt.dateTime))}
                            </span>
                            <span className="text-xs font-medium text-emerald-400">
                              {formatCurrency(apt.price || 45)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Serviços em Alta</CardTitle>
                    <TrendingUp className="h-4 w-4 text-amber-400" />
                  </div>
                  <CardDescription>
                    Ranking de serviços concluídos no período
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.topServices.length === 0 ? (
                    <div className="py-10 text-center text-sm text-zinc-500">
                      Sem serviços concluídos neste período.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {data.topServices.map((item, idx) => (
                        <div key={item.service} className="space-y-1.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium text-zinc-200">
                              {idx + 1}. {item.service}
                            </span>
                            <span className="text-xs font-semibold text-amber-400">
                              {item.count}x • {formatCurrency(item.revenue)}
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                            <div
                              className="h-full rounded-full bg-amber-500"
                              style={{
                                width: `${Math.min(
                                  100,
                                  Math.max(20, (item.count / (data.topServices[0]?.count || 1)) * 100)
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
