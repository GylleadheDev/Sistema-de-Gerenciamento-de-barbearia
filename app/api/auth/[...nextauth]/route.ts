import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// Marcar como rota dinâmica para Next.js
export const dynamic = 'force-dynamic'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
