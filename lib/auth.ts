import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { prisma } from '@/lib/prisma'

/**
 * Better Auth substitui o NextAuth que estava aqui.
 *
 * Principais diferenças práticas para este projeto:
 * - a senha deixa de morar em `users.password` e passa para `accounts.password`
 *   (providerId "credential"), com hash próprio do Better Auth (scrypt);
 * - `users.emailVerified` deixa de ser `DateTime?` e vira `Boolean`;
 * - a sessão agora é persistida em `sessions` (o NextAuth usava só JWT).
 *
 * `role` é um campo extra declarado abaixo: ele já existia no schema e é
 * exposto na sessão, mas nada o consumia — é a base para a autorização por
 * role que as APIs ainda não implementam.
 */
export const auth = betterAuth({
  // BETTER_AUTH_* é o nome canônico do Better Auth; os NEXTAUTH_* ficam como
  // fallback para não exigir troca imediata em toda instância de deploy.
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXTAUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET || process.env.NEXTAUTH_SECRET,

  database: prismaAdapter(prisma, {
    // O nome do provider do Prisma ("postgresql"), não o nome do adaptador.
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 dias (mantém o maxAge anterior do NextAuth)
    updateAge: 60 * 60 * 24,       // renova a cada 24h
  },

  // `user` é chave de topo do Better Auth — NÃO fica dentro de `advanced`.
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'ADMIN',
        required: false,
        returned: true, // expõe session.user.role
      },
    },
  },
})

export type Session = typeof auth.$Infer.Session
