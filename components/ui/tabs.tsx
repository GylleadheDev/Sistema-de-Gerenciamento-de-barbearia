import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsProps {
  children: React.ReactNode
  className?: string
  value?: string
}

interface TabsListProps {
  children: React.ReactNode
  className?: string
}

interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
  active?: boolean
  onClick?: () => void
}

interface TabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
  active?: boolean
}

export function Tabs({ children, className }: TabsProps) {
  return (
    <div className={cn("w-full", className)}>
      {children}
    </div>
  )
}

export function TabsList({ children, className }: TabsListProps) {
  return (
    <div className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-gray-100 p-1 text-gray-500 w-full",
      className
    )}>
      {children}
    </div>
  )
}

export function TabsTrigger({ 
  value, 
  children, 
  className, 
  active, 
  onClick 
}: TabsTriggerProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        active 
          ? "bg-white text-gray-900 shadow-sm" 
          : "text-gray-600 hover:text-gray-900",
        className
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function TabsContent({ 
  value, 
  children, 
  className, 
  active 
}: TabsContentProps) {
  if (!active) return null

  return (
    <div className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}>
      {children}
    </div>
  )
}
