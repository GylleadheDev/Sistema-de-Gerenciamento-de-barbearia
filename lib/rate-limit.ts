import { NextRequest } from 'next/server'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

export function rateLimit(config: RateLimitConfig) {
  return (request: NextRequest) => {
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const now = Date.now()
    const windowMs = config.windowMs
    const maxRequests = config.maxRequests

    const key = `${ip}:${Math.floor(now / windowMs)}`
    const current = rateLimitMap.get(key)

    if (!current) {
      rateLimitMap.set(key, { count: 1, resetTime: now + windowMs })
      return { success: true, remaining: maxRequests - 1 }
    }

    if (current.count >= maxRequests) {
      return { 
        success: false, 
        error: 'Rate limit exceeded',
        resetTime: current.resetTime
      }
    }

    current.count++
    return { success: true, remaining: maxRequests - current.count }
  }
}

// Limpar entradas expiradas periodicamente
setInterval(() => {
  const now = Date.now()
  rateLimitMap.forEach((value, key) => {
    if (now > value.resetTime) {
      rateLimitMap.delete(key)
    }
  })
}, 60000) // Limpar a cada minuto

export const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  maxRequests: 100 // 100 requests por 15 minutos
})

export const authRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  maxRequests: 20 // 20 tentativas de login por 5 minutos
})
