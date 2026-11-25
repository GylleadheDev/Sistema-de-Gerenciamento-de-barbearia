"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Scissors,
  Plus,
  Check,
  Search,
  FileText,
} from "lucide-react"
import toast from "react-hot-toast"
import { formatPhone, formatCurrency } from "@/lib/utils"
import { api, handleApiError, serviceCatalog } from "@/lib/api"

interface Client {
  id: string
  name: string
  phone: string
  email?: string
}

export default function NewAppointmentPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    clientId: "",
    service: "",
    date: "",
    time: "",
    notes: "",
  })

  useEffect(() => {
    const fetchClients = async () => {
      try {
        setIsLoading(true)
        const response = await api.getClients({ limit: 100 })
        if (response.success && response.data) {
          setClients(response.data.clients || [])
        }
      } catch (error) {
        toast.error(handleApiError(error))
      } finally {
        setIsLoading(false)
      }
    }
    fetchClients()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.clientId || !formData.service || !formData.date || !formData.time) {
      toast.error("Selecione o cliente, serviço, data e horário.")
      return
    }

    try {
      setIsSubmitting(true)
      const dateTime = new Date(`${formData.date}T${formData.time}:00`).toISOString()

      const response = await api.createAppointment({
        clientId: formData.clientId,
        service: formData.service,
        dateTime,
        notes: formData.notes || undefined,
      })

      if (response.success) {
        toast.success("Horário reservado com sucesso!")
        router.push("/dashboard/agendamentos")
      }
    } catch (error) {
      toast.error(handleApiError(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const selectedClient = clients.find((c) => c.id === formData.clientId)
  const selectedServiceItem = serviceCatalog.find((s) => s.name === formData.service)

  const timeSlots: string[] = []
  for (let hour = 8; hour <= 19; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      timeSlots.push(`${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`)
    }
  }

  const today = new Date().toISOString().split("T")[0]

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Novo Agendamento
            </h1>
            <p className="text-sm text-zinc-400">
              Reserve um horário para atendimento na barbearia
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Step 1: Client */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">1. Cliente</CardTitle>
                <CardDescription>Selecione quem será atendido</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedClient ? (
                  <div className="flex items-center justify-between rounded-xl border border-amber-500/40 bg-amber-500/10 p-4">
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500 text-base font-bold text-zinc-950">
                        {selectedClient.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{selectedClient.name}</p>
                        <p className="text-xs text-zinc-300">{formatPhone(selectedClient.phone)}</p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsModalOpen(true)}
                    >
                      Trocar
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsModalOpen(true)}
                    className="h-14 w-full border-dashed border-zinc-700 hover:border-amber-500/60"
                  >
                    <Plus className="h-4 w-4 text-amber-400" />
                    <span>Selecionar Cliente Cadastrado</span>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Step 2: Service Catalog */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">2. Serviço</CardTitle>
                <CardDescription>Escolha o procedimento desejado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {serviceCatalog.map((item) => {
                    const active = formData.service === item.name
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setFormData({ ...formData, service: item.name })}
                        className={`flex items-center justify-between rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                          active
                            ? "border-amber-500 bg-amber-500/15 text-white shadow-sm"
                            : "border-zinc-800 bg-zinc-950/60 text-zinc-300 hover:border-zinc-700"
                        }`}
                      >
                        <div>
                          <p className="text-sm font-semibold">{item.name}</p>
                          <p className="text-xs text-zinc-400">{item.duration} min</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-amber-400">
                            {formatCurrency(item.price)}
                          </span>
                          {active && <Check className="h-4 w-4 text-amber-400" />}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Step 3: Date & Time */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-base">3. Data, Horário e Observações</CardTitle>
                <CardDescription>Atendimentos de Segunda a Sábado, das 08h às 19h30</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Data *</label>
                    <div className="relative">
                      <Calendar className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                      <Input
                        type="date"
                        min={today}
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">Horário *</label>
                    <div className="relative">
                      <Clock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                      <select
                        value={formData.time}
                        onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                        className="flex h-10 w-full rounded-lg border border-zinc-800 bg-zinc-900/80 pl-10 pr-3 text-sm text-zinc-100 focus-visible:outline-none focus-visible:border-amber-500/70"
                        required
                      >
                        <option value="">Escolha um horário</option>
                        {timeSlots.map((slot) => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">
                    Observações (opcional)
                  </label>
                  <div className="relative">
                    <FileText className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                    <textarea
                      rows={2}
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="Ex: Degradê navalhado, preferência por navalha quente..."
                      className="w-full rounded-lg border border-zinc-800 bg-zinc-900/80 py-2 pl-10 pr-3.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus-visible:outline-none focus-visible:border-amber-500/70"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Sidebar Card */}
          <div className="space-y-4">
            <Card className="sticky top-6 border-amber-500/30">
              <CardHeader>
                <Badge variant="default" className="w-fit">
                  Resumo da Reserva
                </Badge>
                <CardTitle className="mt-1">Revisão</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex justify-between border-b border-zinc-800 pb-3">
                  <span className="text-zinc-400">Cliente</span>
                  <span className="font-medium text-white">
                    {selectedClient?.name || "Não selecionado"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-3">
                  <span className="text-zinc-400">Serviço</span>
                  <span className="font-medium text-white">
                    {formData.service || "Não selecionado"}
                  </span>
                </div>
                <div className="flex justify-between border-b border-zinc-800 pb-3">
                  <span className="text-zinc-400">Data & Hora</span>
                  <span className="font-medium text-white">
                    {formData.date && formData.time
                      ? `${formData.date} às ${formData.time}`
                      : "Pendente"}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-zinc-400">Valor Estimado</span>
                  <span className="text-lg font-bold text-amber-400">
                    {formatCurrency(selectedServiceItem?.price || 0)}
                  </span>
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="mt-4 w-full h-11"
                >
                  <Scissors className="h-4 w-4" />
                  {isSubmitting ? "Confirmando..." : "Confirmar Agendamento"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </form>

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSearchTerm("")
          }}
          title="Selecionar Cliente"
          description="Busque pelo nome, telefone ou e-mail do cliente"
        >
          <div className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                placeholder="Pesquisar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, clientId: client.id })
                    setIsModalOpen(false)
                    setSearchTerm("")
                  }}
                  className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-3 text-left transition-colors hover:border-amber-500/50 hover:bg-zinc-900 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 font-bold text-amber-400">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{client.name}</p>
                      <p className="text-xs text-zinc-400">{formatPhone(client.phone)}</p>
                    </div>
                  </div>
                  <User className="h-4 w-4 text-zinc-500" />
                </button>
              ))}

              {filteredClients.length === 0 && (
                <div className="py-8 text-center text-sm text-zinc-500">
                  Nenhum cliente encontrado.
                </div>
              )}
            </div>
          </div>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
