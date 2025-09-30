import { NextRequest, NextResponse } from 'next/server'

// Headers de segurança
export const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:;",
}

// Validar origem das requisições
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  
  // Permitir requisições do mesmo domínio
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const allowedOrigins = [
    baseUrl,
    'http://localhost:3000', // Para desenvolvimento
    'https://localhost:3000',
  ]
  
  // Adicionar domínios Vercel automaticamente
  if (process.env.VERCEL_URL) {
    allowedOrigins.push(`https://${process.env.VERCEL_URL}`)
  }
  
  if (origin && allowedOrigins.includes(origin)) {
    return true
  }
  
  if (referer && allowedOrigins.some(allowed => referer.startsWith(allowed))) {
    return true
  }
  
  return false
}

// Sanitizar dados de entrada
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remover tags HTML básicas
    .replace(/javascript:/gi, '') // Remover javascript:
    .replace(/on\w+=/gi, '') // Remover event handlers
}

// Validar tamanho do payload
export function validatePayloadSize(request: NextRequest, maxSize: number = 1024 * 1024): boolean {
  const contentLength = request.headers.get('content-length')
  
  if (contentLength && parseInt(contentLength) > maxSize) {
    return false
  }
  
  return true
}

// Middleware de segurança
export function securityMiddleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Adicionar headers de segurança
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  // Validar origem para APIs
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (!validateOrigin(request)) {
      return NextResponse.json(
        { error: 'Origem não autorizada' },
        { status: 403 }
      )
    }
    
    // Validar tamanho do payload
    if (!validatePayloadSize(request)) {
      return NextResponse.json(
        { error: 'Payload muito grande' },
        { status: 413 }
      )
    }
  }
  
  return response
}
