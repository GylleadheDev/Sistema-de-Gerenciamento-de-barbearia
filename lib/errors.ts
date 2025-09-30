import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error)

  if (error instanceof AppError) {
    return NextResponse.json(
      { 
        error: error.message,
        code: error.code,
        statusCode: error.statusCode 
      },
      { status: error.statusCode }
    )
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      { 
        error: 'Dados inválidos',
        details: error.errors,
        statusCode: 400 
      },
      { status: 400 }
    )
  }

  if (error instanceof Error) {
    return NextResponse.json(
      { 
        error: error.message,
        statusCode: 500 
      },
      { status: 500 }
    )
  }

  return NextResponse.json(
    { 
      error: 'Erro interno do servidor',
      statusCode: 500 
    },
    { status: 500 }
  )
}

export function createErrorResponse(message: string, statusCode: number = 500, code?: string) {
  return NextResponse.json(
    { 
      error: message,
      code,
      statusCode 
    },
    { status: statusCode }
  )
}

export function createSuccessResponse(data: any, message?: string) {
  return NextResponse.json({
    success: true,
    data,
    message,
  })
}
