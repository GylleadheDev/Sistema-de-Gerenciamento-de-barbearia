import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Marcar como rota dinâmica para Next.js
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Testar conexão com o banco
    const userCount = await prisma.user.count()
    
    // Verificar se existe usuário admin
    const adminUser = await prisma.user.findFirst({
      where: {
        email: 'admin@barbearia.com'
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        userCount,
        adminExists: !!adminUser,
        adminUser: adminUser || null,
        databaseConnected: true,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Database test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Database connection failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}