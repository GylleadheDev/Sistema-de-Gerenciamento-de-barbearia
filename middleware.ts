import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { apiRateLimit, authRateLimit } from '@/lib/rate-limit'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Aplicar rate limiting para APIs
  if (pathname.startsWith('/api/')) {
    const rateLimitResult = apiRateLimit(request)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Muitas requisições. Tente novamente mais tarde.',
          resetTime: rateLimitResult.resetTime 
        },
        { status: 429 }
      )
    }
  }

  // Rate limiting específico para autenticação
  if (pathname.startsWith('/api/auth/signin')) {
    const rateLimitResult = authRateLimit(request)
    
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Muitas tentativas de login. Tente novamente mais tarde.',
          resetTime: rateLimitResult.resetTime 
        },
        { status: 429 }
      )
    }
  }

  // Verificar autenticação para rotas protegidas
  const isLoginPage = pathname === '/login'
  const isApiRoute = pathname.startsWith('/api')
  const isPublicRoute = pathname === '/' || pathname.startsWith('/_next') || pathname.startsWith('/favicon')
  const isAuthRoute = pathname.startsWith('/api/auth/')
  
  // Permitir acesso a rotas públicas e de autenticação
  if (isPublicRoute || isAuthRoute) {
    return NextResponse.next()
  }
  
  // Obter token do NextAuth
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  })
  
  // Se não há token e está tentando acessar rota protegida
  if (!token) {
    if (isLoginPage) {
      return NextResponse.next()
    }
    
    if (isApiRoute) {
      return NextResponse.json(
        { error: 'Não autorizado', success: false },
        { status: 401 }
      )
    }
    
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  // Se há token mas está na página de login, redirecionar para dashboard
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
}
