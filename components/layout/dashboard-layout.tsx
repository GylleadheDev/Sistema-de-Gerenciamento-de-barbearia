"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Sidebar, MobileMenuButton } from "./sidebar"
import { Scissors } from "lucide-react"
import { api } from "@/lib/api"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authorized, setAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let active = true
    const checkAuth = async () => {
      try {
        const res = await api.getSession()
        if (!active) return
        if (res.success && res.data?.user) {
          setAuthorized(true)
        } else {
          router.replace("/login")
        }
      } catch {
        if (active) router.replace("/login")
      }
    }
    checkAuth()
    return () => {
      active = false
    }
  }, [router])

  if (!authorized) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 animate-pulse items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/15 text-amber-400">
            <Scissors className="h-4 w-4" />
          </div>
          <span className="text-sm font-medium">Verificando sessão...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-zinc-800/80 bg-zinc-950/80 px-4 backdrop-blur-md sm:px-6 lg:hidden">
          <MobileMenuButton onClick={() => setSidebarOpen(true)} />
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Scissors className="h-4 w-4" />
            </div>
            <span className="text-base font-bold tracking-tight">
              BARBER<span className="text-amber-500">PRO</span>
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/5 via-zinc-950 to-zinc-950">
          <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
