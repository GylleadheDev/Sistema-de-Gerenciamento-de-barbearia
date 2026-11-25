"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import {
  Plus,
  Edit3,
  Trash2,
  Search,
  Phone,
  Mail,
  Calendar,
  UserPlus,
  Users,
} from "lucide-react"
import toast from "react-hot-toast"
import { formatPhone, formatDate } from "@/lib/utils"
import { api, handleApiError } from "@/lib/api"

interface Client {
  id: string
  name: string
  phone: string
  email?: string
  createdAt: string
  totalAppointments?: number
  pendingAppointments?: number
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  })

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

  useEffect(() => {
    fetchClients()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error("Nome e telefone são obrigatórios")
      return
    }

    try {
      const payload = {
        name: formData.name.trim(),
        phone: formData.phone.replace(/\D/g, ""),
        email: formData.email.trim() || undefined,
      }

      if (editingClient) {
        const res = await api.updateClient(editingClient.id, payload)
        if (res.success) {
          toast.success("Dados do cliente atualizados!")
          await fetchClients()
        }
      } else {
        const res = await api.createClient(payload)
        if (res.success) {
          toast.success("Novo cliente cadastrado!")
          await fetchClients()
        }
      }

      setIsModalOpen(false)
      setEditingClient(null)
      setFormData({ name: "", phone: "", email: "" })
    } catch (error) {
      toast.error(handleApiError(error))
    }
  }

  const handleEdit = (client: Client) => {
    setEditingClient(client)
    setFormData({
      name: client.name,
      phone: client.phone,
      email: client.email || "",
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (clientId: string) => {
    try {
      const response = await api.deleteClient(clientId)
      if (response.success) {
        setClients((prev) => prev.filter((c) => c.id !== clientId))
        toast.success("Cliente excluído com sucesso!")
      }
    } catch (error) {
      toast.error(handleApiError(error))
    }
  }

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Carteira de Clientes
            </h1>
            <p className="text-sm text-zinc-400">
              Gerencie contatos, histórico de visitas e fidelidade
            </p>
          </div>
          <Button
            onClick={() => {
              setEditingClient(null)
              setFormData({ name: "", phone: "", email: "" })
              setIsModalOpen(true)
            }}
          >
            <UserPlus className="h-4 w-4" />
            Novo Cliente
          </Button>
        </div>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <Input
              placeholder="Buscar por nome, telefone ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="outline" className="w-fit">
            <Users className="h-3.5 w-3.5 text-amber-400" />
            {filteredClients.length} clientes listados
          </Badge>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="h-40 animate-pulse bg-zinc-900/40" />
            ))}
          </div>
        ) : filteredClients.length === 0 ? (
          <Card className="border-dashed border-zinc-800 bg-zinc-900/30">
            <CardContent className="flex flex-col items-center justify-center py-14 text-center">
              <Users className="h-12 w-12 text-zinc-600" />
              <h3 className="mt-3 text-base font-semibold text-zinc-200">
                Nenhum cliente encontrado
              </h3>
              <p className="mt-1 text-xs text-zinc-500">
                Adicione seu primeiro cliente para agendar horários.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredClients.map((client) => (
              <Card
                key={client.id}
                className="flex flex-col justify-between transition-all hover:border-zinc-700"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 text-base font-bold text-amber-400">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-white">
                          {client.name}
                        </h3>
                        <p className="text-xs text-zinc-500">
                          Desde {formatDate(new Date(client.createdAt))}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(client)}
                        title="Editar cliente"
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(client.id)}
                        title="Excluir cliente"
                      >
                        <Trash2 className="h-4 w-4 text-zinc-500 hover:text-rose-400" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 border-t border-zinc-800/80 pt-3 text-xs text-zinc-300">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-amber-400" />
                      <span>{formatPhone(client.phone)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-zinc-500" />
                      <span className="truncate">{client.email || "Sem e-mail cadastrado"}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between pt-2">
                    <Badge variant="outline">
                      <Calendar className="h-3 w-3 text-amber-400" />
                      {client.totalAppointments || 0} visitas
                    </Badge>
                    {(client.pendingAppointments || 0) > 0 && (
                      <Badge variant="warning">
                        {client.pendingAppointments} agendado(s)
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setEditingClient(null)
          }}
          title={editingClient ? "Editar Cliente" : "Novo Cliente"}
          description="Preencha os dados de contato do cliente"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Nome Completo *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Gabriel Almeida"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Telefone / WhatsApp (DDD + Número) *
              </label>
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    phone: e.target.value.replace(/\D/g, "").slice(0, 11),
                  })
                }
                placeholder="11999998888"
                maxLength={11}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                E-mail (opcional)
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="cliente@email.com"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                <Plus className="h-4 w-4" />
                {editingClient ? "Salvar Alterações" : "Cadastrar Cliente"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </DashboardLayout>
  )
}
