"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Calendar,
  CalendarPlus,
  LogOut,
  Scissors,
  Menu,
  X,
  Sparkles,
} from "lucide-react"
import toast from "react-hot-toast"

const navigation = [
  { name: "Visão Geral", href: "/dashboard", icon: LayoutDashboard },
  { name: "Agendamentos", href: "/dashboard/agendamentos", icon: Calendar },
  { name: "Novo Horário", href: "/dashboard/agendamentos/novo", icon: CalendarPlus },
  { name: "Clientes", href: "/dashboard/clientes", icon: Users },
]

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await api.logout()
      toast.success("Sessão encerrada")
      router.push("/login")
      router.refresh()
    } catch {
      toast.error("Erro ao sair")
    }
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-zinc-800/80 bg-zinc-950/95 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-20 items-center justify-between border-b border-zinc-800/80 px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shadow-inner">
              <Scissors className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold tracking-tight text-zinc-100">
                  BARBER<span className="text-amber-500">PRO</span>
                </span>
              </div>
              <p className="text-[11px] font-medium text-zinc-500">Go Backend • Studio Edition</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white lg:hidden cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
            Menu Principal
          </p>
          <nav className="space-y-1.5">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-amber-500 text-zinc-950 font-semibold shadow-md shadow-amber-500/15"
                      : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4 shrink-0 transition-colors",
                      isActive ? "text-zinc-950" : "text-zinc-400 group-hover:text-amber-400"
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          <div className="mt-8 rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-zinc-900 to-zinc-950 p-4">
            <div className="flex items-center gap-2 text-amber-400">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs font-semibold">Motor Go 1.24+ Ativo</span>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
              API ultra-rápida em Go com autenticação JWT e Tailwind CSS v4.
            </p>
          </div>
        </div>

        <div className="border-t border-zinc-800/80 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-zinc-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Encerrar Sessão
          </button>
        </div>
      </aside>
    </>
  )
}

export function MobileMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-zinc-800 bg-zinc-900 p-2 text-zinc-300 hover:bg-zinc-800 hover:text-white lg:hidden cursor-pointer"
    >
      <Menu className="h-5 w-5" />
    </button>
  )
}
