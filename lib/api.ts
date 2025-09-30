// Utilitários para chamadas da API no frontend

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  statusCode?: number
}

export interface PaginationResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export interface AppointmentFilters {
  status?: 'PENDING' | 'COMPLETED' | 'CANCELLED'
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

class ApiClient {
  private baseUrl = '/api'

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`)
      }

      return data
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error)
      throw error
    }
  }

  // Métodos para Clientes
  async getClients(filters: ClientFilters = {}): Promise<ApiResponse<any>> {
    const params = new URLSearchParams()
    if (filters.search) params.append('search', filters.search)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())

    return this.request(`/clients?${params.toString()}`)
  }

  async createClient(clientData: any): Promise<ApiResponse<any>> {
    return this.request('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData),
    })
  }

  async updateClient(id: string, clientData: any): Promise<ApiResponse<any>> {
    return this.request(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clientData),
    })
  }

  async deleteClient(id: string): Promise<ApiResponse<void>> {
    return this.request(`/clients/${id}`, {
      method: 'DELETE',
    })
  }

  async getClient(id: string): Promise<ApiResponse<any>> {
    return this.request(`/clients/${id}`)
  }

  // Métodos para Agendamentos
  async getAppointments(filters: AppointmentFilters = {}): Promise<ApiResponse<any>> {
    const params = new URLSearchParams()
    if (filters.status) params.append('status', filters.status)
    if (filters.startDate) params.append('startDate', filters.startDate)
    if (filters.endDate) params.append('endDate', filters.endDate)
    if (filters.search) params.append('search', filters.search)
    if (filters.page) params.append('page', filters.page.toString())
    if (filters.limit) params.append('limit', filters.limit.toString())

    return this.request(`/appointments?${params.toString()}`)
  }

  async createAppointment(appointmentData: any): Promise<ApiResponse<any>> {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    })
  }

  async updateAppointment(id: string, appointmentData: any): Promise<ApiResponse<any>> {
    return this.request(`/appointments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(appointmentData),
    })
  }

  async updateAppointmentStatus(id: string, status: string): Promise<ApiResponse<any>> {
    return this.request(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  }

  async deleteAppointment(id: string): Promise<ApiResponse<void>> {
    return this.request(`/appointments/${id}`, {
      method: 'DELETE',
    })
  }

  async getAppointment(id: string): Promise<ApiResponse<any>> {
    return this.request(`/appointments/${id}`)
  }

  // Métodos para Dashboard
  async getDashboardStats(period: string = 'month'): Promise<ApiResponse<any>> {
    return this.request(`/dashboard/stats?period=${period}`)
  }
}

// Instância singleton do cliente da API
export const api = new ApiClient()

// Hook personalizado para tratamento de erros
export function handleApiError(error: any): string {
  if (error instanceof Error) {
    return error.message
  }
  
  if (typeof error === 'string') {
    return error
  }
  
  return 'Erro inesperado. Tente novamente.'
}

// Utilitário para formatar responses da API
export function formatApiResponse<T>(response: ApiResponse<T>): T | null {
  if (response.success && response.data) {
    return response.data
  }
  return null
}

// Lista de serviços disponíveis
export const availableServices = [
  'Corte de Cabelo',
  'Barba',
  'Corte + Barba',
  'Corte + Barba + Bigode',
  'Sobrancelha',
  'Corte + Sobrancelha',
  'Barba + Bigode',
  'Corte Completo'
]

// Status de agendamentos
export const appointmentStatuses = {
  PENDING: 'Pendente',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
} as const

export type AppointmentStatus = keyof typeof appointmentStatuses