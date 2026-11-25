"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { api, handleApiError } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Scissors, Lock, Mail, Sparkles, ShieldCheck, ArrowRight } from "lucide-react"
import toast from "react-hot-toast"

const DEMO_EMAIL = "admin@barbearia.com"
const DEMO_PASSWORD = "admin123"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await api.login(email.trim(), password)
      if (res.success) {
        toast.success("Bem-vindo ao BarberPro!")
        router.push("/dashboard")
        router.refresh()
      } else {
        toast.error(res.error || "Credenciais inválidas")
      }
    } catch (error) {
      toast.error(handleApiError(error))
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemo = () => {
    setEmail(DEMO_EMAIL)
    setPassword(DEMO_PASSWORD)
    toast.success("Credenciais de demonstração preenchidas")
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4 py-12 text-zinc-100">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-amber-500/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-10 h-72 w-72 rounded-full bg-amber-600/10 blur-3xl" />

      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/40 bg-amber-500/15 text-amber-400 shadow-lg shadow-amber-500/10">
            <Scissors className="h-7 w-7" />
          </div>
          <Badge variant="default" className="mb-3">
            <Sparkles className="h-3 w-3" />
            Go 1.24+ API & Tailwind CSS v4
          </Badge>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            BARBER<span className="text-amber-500">PRO</span>
          </h1>
          <p className="mt-1.5 text-sm text-zinc-400">
            Gestão inteligente de agendamentos e clientes
          </p>
        </div>

        <Card className="border-zinc-800/90 bg-zinc-900/75 shadow-2xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">Acesso Administrativo</CardTitle>
            <CardDescription>
              Entre com suas credenciais para gerenciar a barbearia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-medium text-zinc-300">
                  E-mail
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@barbearia.com"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-medium text-zinc-300">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                  <Input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10"
                  />
                </div>
              </div>

              <Button type="submit" disabled={isLoading} className="mt-2 w-full h-11">
                {isLoading ? "Autenticando no servidor Go..." : "Entrar no Painel"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 rounded-xl border border-zinc-800 bg-zinc-950/80 p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
                  <ShieldCheck className="h-4 w-4 text-amber-400" />
                  Acesso Rápido Demo
                </div>
                <Button type="button" variant="outline" size="sm" onClick={fillDemo}>
                  Preencher
                </Button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-zinc-400">
                <div className="truncate rounded-md bg-zinc-900 px-2.5 py-1.5 font-mono">
                  {DEMO_EMAIL}
                </div>
                <div className="truncate rounded-md bg-zinc-900 px-2.5 py-1.5 font-mono">
                  Senha: {DEMO_PASSWORD}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
