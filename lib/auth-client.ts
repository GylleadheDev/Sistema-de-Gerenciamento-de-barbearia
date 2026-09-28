'use client'

import { createAuthClient } from 'better-auth/react'

/**
 * Cliente Better Auth para uso no browser (login, logout, useSession).
 *
 * Sem `baseURL` de propósito: ele usa a origem atual, então funciona igual em
 * localhost e em produção sem depender de NEXT_PUBLIC_APP_URL.
 * O `basePath` padrão `/api/auth` bate com app/api/auth/[...all]/route.ts.
 */
export const authClient = createAuthClient()
