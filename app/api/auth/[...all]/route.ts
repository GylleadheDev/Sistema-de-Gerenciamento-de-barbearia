import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

// Marcar como rota dinâmica para evitar problemas no build
export const dynamic = 'force-dynamic'

// Substitui app/api/auth/[...nextauth]/route.ts do NextAuth.
// Todas as rotas do Better Auth (sign-in, sign-out, session, csrf...)
// caem aqui em /api/auth/*.
export const { GET, POST } = toNextJsHandler(auth)
