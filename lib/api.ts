export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  code?: string
  statusCode?: number
}

export interface AppointmentFilters {
  status?: "PENDING" | "COMPLETED" | "CANCELLED"
  startDate?: string
  endDate?: string
  search?: string
  page?: number
  limit?: number
}

export interface ClientFilters {
  search?: string
  page?: number
  limit?: number
}

export interface ServiceCatalogItem {
  name: string
  price: number
  duration: number
}

export const serviceCatalog: ServiceCatalogItem[] = [
  { name: "Corte de Cabelo", price: 45, duration: 40 },
  { name: "Barba", price: 35, duration: 30 },
  { name: "Corte + Barba", price: 70, duration: 60 },
  { name: "Corte + Barba + Bigode", price: 80, duration: 75 },
  { name: "Sobrancelha", price: 20, duration: 15 },
  { name: "Corte + Sobrancelha", price: 60, duration: 50 },
  { name: "Barba + Bigode", price: 45, duration: 40 },
  { name: "Corte Completo", price: 95, duration: 90 },
]

export const availableServices = serviceCatalog.map((s) => s.name)

class ApiClient {
  private baseUrl = "/api"

  private getToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem("barbearia_token")
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    const token = this.getToken()

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    }
    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    })

    const data = await response.json().catch(() => ({
      success: false,
      error: `Erro HTTP ${response.status}`,
    }))

    if (!response.ok) {
      if (response.status === 401 && typeof window !== "undefined" && !endpoint.includes("/auth/")) {
        localStorage.removeItem("barbearia_token")
        window.location.href = "/login"
      }
      throw new Error(data.error || `Erro na requisição (${response.status})`)
    }

    return data
  }

  // Autenticação Go Backend
  async login(email: string, password: string): Promise<ApiResponse<any>> {
    const res = await this.request<any>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
    if (res.success && res.data?.token && typeof window !== "undefined") {
      localStorage.setItem("barbearia_token", res.data.token)
    }
    return res
  }

  async logout(): Promise<ApiResponse<any>> {
    try {
      return await this.request("/auth/logout", { method: "POST" })
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("barbearia_token")
      }
    }
  }

  async getSession(): Promise<ApiResponse<any>> {
    return this.request("/auth/session")
  }

  // Clientes
  async getClients(filters: ClientFilters = {}): Promise<ApiResponse<any>> {
    const params = new URLSearchParams()
    if (filters.search) params.append("search", filters.search)
    if (filters.page) params.append("page", filters.page.toString())
    if (filters.limit) params.append("limit", filters.limit.toString())
    const qs = params.toString()
    return this.request(`/clients${qs ? `?${qs}` : ""}`)
  }

  async createClient(clientData: any): Promise<ApiResponse<any>> {
    return this.request("/clients", {
      method: "POST",
      body: JSON.stringify(clientData),
    })
  }

  async updateClient(id: string, clientData: any): Promise<ApiResponse<any>> {
    return this.request(`/clients/${id}`, {
      method: "PUT",
      body: JSON.stringify(clientData),
    })
  }

  async deleteClient(id: string): Promise<ApiResponse<void>> {
    return this.request(`/clients/${id}`, {
      method: "DELETE",
    })
  }

  // Agendamentos
  async getAppointments(filters: AppointmentFilters = {}): Promise<ApiResponse<any>> {
    const params = new URLSearchParams()
    if (filters.status) params.append("status", filters.status)
    if (filters.startDate) params.append("startDate", filters.startDate)
    if (filters.endDate) params.append("endDate", filters.endDate)
    if (filters.search) params.append("search", filters.search)
    if (filters.page) params.append("page", filters.page.toString())
    if (filters.limit) params.append("limit", filters.limit.toString())
    const qs = params.toString()
    return this.request(`/appointments${qs ? `?${qs}` : ""}`)
  }

  async createAppointment(appointmentData: any): Promise<ApiResponse<any>> {
    return this.request("/appointments", {
      method: "POST",
      body: JSON.stringify(appointmentData),
    })
  }

  async updateAppointmentStatus(id: string, status: string): Promise<ApiResponse<any>> {
    return this.request(`/appointments/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    })
  }

  async deleteAppointment(id: string): Promise<ApiResponse<void>> {
    return this.request(`/appointments/${id}`, {
      method: "DELETE",
    })
  }

  // Dashboard
  async getDashboardStats(period: string = "month"): Promise<ApiResponse<any>> {
    return this.request(`/dashboard/stats?period=${period}`)
  }
}

export const api = new ApiClient()

export function handleApiError(error: any): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  return "Erro inesperado. Verifique se o backend em Go está em execução."
}
