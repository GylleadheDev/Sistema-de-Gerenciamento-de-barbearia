import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsProps {
  children: React.ReactNode
  className?: string
  value?: string
}

export function Tabs({ children, className }: TabsProps) {
  return <div className={cn("w-full", className)}>{children}</div>
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/80 p-1 text-zinc-400",
        className
      )}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({
  children,
  className,
  active,
  onClick,
}: {
  value: string
  children: React.ReactNode
  className?: string
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-xs sm:text-sm font-medium transition-all cursor-pointer",
        active
          ? "bg-amber-500 text-zinc-950 font-semibold shadow-sm"
          : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50",
        className
      )}
    >
      {children}
    </button>
  )
}

export function TabsContent({
  children,
  className,
  active,
}: {
  value: string
  children: React.ReactNode
  className?: string
  active?: boolean
}) {
  if (!active) return null
  return <div className={cn("mt-4", className)}>{children}</div>
}
