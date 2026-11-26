"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Scissors } from "lucide-react"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("barbearia_token") : null
    if (token) {
      router.replace("/dashboard")
    } else {
      router.replace("/login")
    }
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 animate-pulse items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/15 text-amber-400">
          <Scissors className="h-5 w-5" />
        </div>
        <span className="text-sm font-medium">Carregando BarberPro...</span>
      </div>
    </div>
  )
}
