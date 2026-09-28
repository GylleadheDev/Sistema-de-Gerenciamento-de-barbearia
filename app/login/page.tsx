'use client'

import { useState } from 'react'
import { authClient } from '@/lib/auth-client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Scissors } from 'lucide-react'
import toast from 'react-hot-toast'

// Credenciais do seed (prisma/seed.ts). Ficam aqui para o bloco de demo da
// página poder preencher o formulário com um clique — digitação manual era a
// variável que mais atrapalhava a distinguir "senha errada" de "bug".
const DEMO_EMAIL = 'admin@barbearia.com'
const DEMO_PASSWORD = 'admin123'

/**
 * Traduz o erro do Better Auth para algo que ajude a resolver o problema.
 *
 * Antes tudo virava "Email ou senha inválidos", o que escondia erros que não
 * têm nada a ver com credenciais (400 de validação de body, 403 de origem/CSRF,
 * falha de rede...). Os códigos vêm de @better-auth/core/error BASE_ERROR_CODES.
 */
function describeLoginError(error: {
  code?: string | null
  message?: string | null
  status?: number | null
}) {
  const code = error.code ?? ''

  switch (code) {
    case 'INVALID_EMAIL_OR_PASSWORD':
      return 'Email ou senha inválidos'
    case 'INVALID_EMAIL':
      return 'Email em formato inválido'
    case 'EMAIL_NOT_VERIFIED':
      return 'Email ainda não verificado'
    case 'EMAIL_PASSWORD_DISABLED':
      return 'Login por email/senha desativado no servidor'
    case 'MISSING_OR_NULL_ORIGIN':
    case 'INVALID_ORIGIN':
      return 'Origem não permitida — acesse por http://localhost:3000'
    case 'CROSS_SITE_NAVIGATION_LOGIN_BLOCKED':
      return 'Requisição bloqueada (proteção CSRF)'
  }

  if (/invalid json/i.test(error.message ?? '')) {
    return 'Requisição malformada — recarregue a página com Ctrl+Shift+R'
  }
  if (error.status && error.status >= 500) return 'Erro no servidor. Tente novamente.'
  if (!error.status) return 'Não foi possível falar com o servidor'
  return `${error.message ?? 'Falha no login'}${code ? ` (${code})` : ''}`
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await authClient.signIn.email({
        email: email.trim(),
        password,
      })

      if (error) {
        // Mantém o detalhe completo no console para depuração.
        console.error('[login] Better Auth devolveu:', error)
        toast.error(describeLoginError(error), { duration: 8000 })
      } else {
        // Aguardar um pouco antes de redirecionar para permitir que a sessão seja estabelecida
        setTimeout(() => {
          router.push('/dashboard')
          router.refresh()
        }, 500)
      }
    } catch (error) {
      toast.error('Erro ao fazer login')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-8 px-4 sm:py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        <div>
          <div className="flex justify-center">
            <Scissors className="h-10 w-10 sm:h-12 sm:w-12 text-primary-600" />
          </div>
          <h2 className="mt-4 sm:mt-6 text-center text-2xl sm:text-3xl font-extrabold text-gray-900">
            Sistema de Barbearia
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Faça login para acessar o painel administrativo
          </p>
        </div>
        
        <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
                placeholder="admin@barbearia.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Senha
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-base"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </div>
          <div className="text-sm text-gray-600 flex flex-col items-center gap-1.5 pt-4 border-t border-gray-200">
            <span className="font-medium text-gray-700">Demo credentials</span>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
              <button
                type="button"
                onClick={() => setEmail(DEMO_EMAIL)}
                className="text-primary-700 underline decoration-dotted underline-offset-2 hover:text-primary-900"
              >
                {DEMO_EMAIL}
              </button>
              <button
                type="button"
                onClick={() => setPassword(DEMO_PASSWORD)}
                className="text-primary-700 underline decoration-dotted underline-offset-2 hover:text-primary-900"
              >
                {DEMO_PASSWORD}
              </button>
            </div>
            <span className="text-xs text-gray-400">clique para preencher</span>
          </div>
        </form>
      </div>
    
    </div>
  )
}
