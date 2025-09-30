import { z } from 'zod'

// Função para validar telefone brasileiro
const phoneRegex = /^(\d{2})(\d{4,5})(\d{4})$/
const validatePhone = (phone: string) => {
  const cleaned = phone.replace(/\D/g, '')
  return cleaned.length >= 10 && cleaned.length <= 11 && phoneRegex.test(cleaned)
}

// Validação para cliente
export const clientSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras e espaços'),
  phone: z.string()
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .max(11, 'Telefone deve ter no máximo 11 dígitos')
    .regex(/^\d+$/, 'Telefone deve conter apenas números')
    .refine(validatePhone, 'Formato de telefone inválido'),
  email: z.string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
})

export const updateClientSchema = clientSchema.partial()

// Lista de serviços válidos
const validServices = [
  'Corte de Cabelo',
  'Barba',
  'Corte + Barba',
  'Corte + Barba + Bigode',
  'Sobrancelha',
  'Corte + Sobrancelha',
  'Barba + Bigode',
  'Corte Completo'
] as const

// Validação para agendamento
export const appointmentSchema = z.object({
  clientId: z.string()
    .min(1, 'Cliente é obrigatório')
    .regex(/^[0-9a-fA-F]{24}$/, 'ID do cliente inválido'),
  service: z.enum(validServices, {
    errorMap: () => ({ message: 'Serviço inválido' })
  }),
  dateTime: z.string()
    .datetime('Data e hora inválidas')
    .refine((date) => {
      const appointmentDate = new Date(date)
      const now = new Date()
      const maxDate = new Date()
      maxDate.setFullYear(maxDate.getFullYear() + 1) // Máximo 1 ano no futuro
      
      return appointmentDate > now && appointmentDate <= maxDate
    }, 'Data deve estar entre hoje e 1 ano no futuro'),
  notes: z.string()
    .max(500, 'Notas devem ter no máximo 500 caracteres')
    .optional(),
})

export const updateAppointmentSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED'], {
    errorMap: () => ({ message: 'Status inválido' })
  }),
  notes: z.string()
    .max(500, 'Notas devem ter no máximo 500 caracteres')
    .optional(),
})

// Validação para usuário
export const userSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres'),
  email: z.string()
    .email('Email inválido')
    .max(100, 'Email deve ter no máximo 100 caracteres'),
  password: z.string()
    .min(6, 'Senha deve ter pelo menos 6 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Senha deve conter pelo menos uma letra minúscula, uma maiúscula e um número'),
  role: z.enum(['ADMIN', 'BARBER']).default('ADMIN'),
})

// Validação para login
export const loginSchema = z.object({
  email: z.string()
    .email('Email inválido')
    .max(100, 'Email deve ter no máximo 100 caracteres'),
  password: z.string()
    .min(1, 'Senha é obrigatória')
    .max(100, 'Senha deve ter no máximo 100 caracteres'),
})

// Validação para busca/paginação
export const paginationSchema = z.object({
  page: z.number().min(1, 'Página deve ser maior que 0').default(1),
  limit: z.number().min(1, 'Limite deve ser maior que 0').max(100, 'Limite máximo é 100').default(10),
  search: z.string().max(100, 'Busca deve ter no máximo 100 caracteres').optional(),
})

// Validação para filtros de agendamento
export const appointmentFiltersSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'CANCELLED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate)
  }
  return true
}, 'Data inicial deve ser anterior à data final')

// Tipos TypeScript derivados dos schemas
export type ClientInput = z.infer<typeof clientSchema>
export type UpdateClientInput = z.infer<typeof updateClientSchema>
export type AppointmentInput = z.infer<typeof appointmentSchema>
export type UpdateAppointmentInput = z.infer<typeof updateAppointmentSchema>
export type UserInput = z.infer<typeof userSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type AppointmentFiltersInput = z.infer<typeof appointmentFiltersSchema>

// Lista exportada de serviços
export { validServices as availableServices }
