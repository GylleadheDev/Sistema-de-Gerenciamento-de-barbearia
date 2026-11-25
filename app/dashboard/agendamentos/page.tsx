"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Scissors,
  Plus,
  Search,
  Phone,
  Trash2,
  FileText,
} from "lucide-react"
import toast from "react-hot-toast"
import { formatDate, formatTime, formatPhone, formatCurrency } from "@/lib/utils"
import { api, handleApiError } from "@/lib/api"

type AppointmentStatus = "PENDING" | "COMPLETED" | "CANCELLED"

interface Appointment {
  id: string
  dateTime: string
  service: string
  price: number
  duration: number
  status: AppointmentStatus
  notes?: string
  client?: {
    id: string
    name: string
    phone: string
    email?: string
  }
}

export default function AppointmentsPage() {
  const router = useRouter()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<AppointmentStatus>("PENDING")
  const [searchTerm, setSearchTerm] = useState("")

  const fetchAppointments = async () => {
    try {
      setIsLoading(true)
      const response = await api.getAppointments({ limit: 100 })
      if (response.success && response.data) {
        setAppointments(response.data.appointments || [])
      } else {
        throw new Error(response.error || "Erro ao carregar agendamentos")
      }
    } catch (error) {
      toast.error(handleApiError(error))
      setAppointments([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  const updateStatus = async (id: string, status: AppointmentStatus) => {
    try {
      const response = await api.updateAppointmentStatus(id, status)
      if (response.success) {
        setAppointments((prev) =>
          prev.map((apt) => (apt.id === id ? { ...apt, status } : apt))
        )
        toast.success(
          status === "COMPLETED"
            ? "Atendimento concluído com sucesso!"
            : "Agendamento cancelado."
        )
      }
    } catch (error) {
      toast.error(handleApiError(error))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const response = await api.deleteAppointment(id)
      if (response.success) {
        setAppointments((prev) => prev.filter((a) => a.id !== id))
        toast.success("Agendamento removido")
      }
    } catch (error) {
      toast.error(handleApiError(error))
    }
  }

  const filteredAppointments = appointments.filter((apt) => {
    if (apt.status !== activeTab) return false
    if (!searchTerm.trim()) return true
    const q = searchTerm.toLowerCase()
    return (
      apt.service.toLowerCase().includes(q) ||
      apt.client?.name?.toLowerCase().includes(q) ||
      apt.client?.phone?.includes(q) ||
      apt.notes?.toLowerCase().includes(q)
    )
  })

  const tabs: Array<{ value: AppointmentStatus; label: string; count: number }> = [
    {
      value: "PENDING",
      label: "Pendentes",
      count: appointments.filter((a) => a.status === "PENDING").length,
    },
    {
      value: "COMPLETED",
      label: "Concluídos",
      count: appointments.filter((a) => a.status === "COMPLETED").length,
    },
    {
      value: "CANCELLED",
      label: "Cancelados",
      count: appointments.filter((a) => a.status === "CANCELLED").length,
    },
  ]

  const renderStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case "PENDING":
        return (
          <Badge variant="warning">
            <Clock className="h-3 w-3" />
            Pendente
          </Badge>
        )
      case "COMPLETED":
        return (
          <Badge variant="success">
            <CheckCircle2 className="h-3 w-3" />
            Concluído
          </Badge>
        )
      case "CANCELLED":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3" />
            Cancelado
          </Badge>
        )
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Agenda de Atendimentos
            </h1>
            <p className="text-sm text-zinc-400">
              Controle de horários, serviços e conclusão de atendimentos
            </p>
          </div>
          <Button onClick={() => router.push("/dashboard/agendamentos/novo")}>
            <Plus className="h-4 w-4" />
            Novo Agendamento
          </Button>
        </div>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <Tabs value={activeTab} className="w-full sm:w-auto">
            <TabsList className="grid w-full grid-cols-3 sm:inline-flex sm:w-auto">
              {tabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  active={activeTab === tab.value}
                  onClick={() => setActiveTab(tab.value)}
                >
                  <span>{tab.label}</span>
                  <span className="rounded-full bg-black/20 px-2 py-0.5 text-xs">
                    {tab.count}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder="Buscar por cliente ou serviço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="h-28 animate-pulse bg-zinc-900/40" />
            ))}
          </div>
        ) : (
          <Tabs value={activeTab}>
            {tabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} active={activeTab === tab.value}>
                {filteredAppointments.length === 0 ? (
                  <Card className="border-dashed border-zinc-800 bg-zinc-900/30">
                    <CardContent className="flex flex-col items-center justify-center py-14 text-center">
                      <Calendar className="h-12 w-12 text-zinc-600" />
                      <h3 className="mt-3 text-base font-semibold text-zinc-200">
                        Nenhum agendamento {tab.label.toLowerCase()}
                      </h3>
                      <p className="mt-1 text-xs text-zinc-500">
                        Crie um novo horário para começar a preencher sua agenda.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {filteredAppointments.map((apt) => (
                      <Card
                        key={apt.id}
                        className="transition-all hover:border-zinc-700"
                      >
                        <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
                          <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-lg font-bold text-amber-400">
                              {apt.client?.name?.charAt(0).toUpperCase() || "C"}
                            </div>
                            <div className="space-y-1.5">
                              <div className="flex flex-wrap items-center gap-2.5">
                                <h3 className="text-base font-semibold text-white">
                                  {apt.client?.name || "Cliente"}
                                </h3>
                                {renderStatusBadge(apt.status)}
                              </div>

                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-400">
                                <span className="inline-flex items-center gap-1.5 font-medium text-amber-400">
                                  <Scissors className="h-3.5 w-3.5" />
                                  {apt.service} ({formatCurrency(apt.price || 45)})
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-zinc-300">
                                  <Calendar className="h-3.5 w-3.5 text-zinc-500" />
                                  {formatDate(new Date(apt.dateTime))} às{" "}
                                  {formatTime(new Date(apt.dateTime))}
                                </span>
                                {apt.client?.phone && (
                                  <span className="inline-flex items-center gap-1.5">
                                    <Phone className="h-3.5 w-3.5 text-zinc-500" />
                                    {formatPhone(apt.client.phone)}
                                  </span>
                                )}
                              </div>

                              {apt.notes && (
                                <p className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-950/80 px-2.5 py-1 text-xs text-zinc-400">
                                  <FileText className="h-3 w-3 text-amber-500" />
                                  {apt.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 border-t border-zinc-800/80 pt-3 sm:border-0 sm:pt-0">
                            {apt.status === "PENDING" && (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => updateStatus(apt.id, "COMPLETED")}
                                  className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  Concluir
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => updateStatus(apt.id, "CANCELLED")}
                                >
                                  <XCircle className="h-4 w-4" />
                                  Cancelar
                                </Button>
                              </>
                            )}
                            {apt.status !== "COMPLETED" && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDelete(apt.id)}
                                title="Excluir registro"
                              >
                                <Trash2 className="h-4 w-4 text-zinc-500 hover:text-rose-400" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </DashboardLayout>
  )
}
