import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  // A URL de conexão vem do `datasource db { url = env("DATABASE_URL") }`
  // declarado no prisma/schema.prisma. Não passar `datasources` aqui de propósito:
  // injetar `url: undefined` quando a env var falta quebra o construtor com
  // PrismaClientConstructorValidationError em vez do erro amigável
  // "Environment variable not found: DATABASE_URL".
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
