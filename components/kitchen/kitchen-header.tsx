"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { LogOut, Users, Banknote } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

type Props = {
  selectedBranch: string
}

export function KitchenHeader({ selectedBranch }: Props) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/kitchen-login"
  }

  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-full bg-accent flex items-center justify-center">
            <Image src="/chef-logo-removebg-preview.png" alt="Logo" fill className="object-cover p-1" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-accent">Pizza Master G</h1>
            <p className="text-xs text-muted-foreground">Kitchen Dashboard</p>
          </div>
        </div>

        {/* Branch Info & Logout */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground">
            <span>Branch: {selectedBranch || "Loading..."}</span>
          </div>
          
          <Link 
            href="/kitchen-dashboard/menu" 
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition mr-2"
          >
            <Banknote className="h-4 w-4" />
            Menu & 86'ing
          </Link>
          
          <Link 
            href="/kitchen-dashboard/eod" 
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition mr-2"
          >
            <Banknote className="h-4 w-4" />
            EOD Cash
          </Link>

          <Link 
            href="/kitchen-dashboard/riders" 
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition mr-4"
          >
            <Users className="h-4 w-4" />
            Manage Riders
          </Link>
          
          <button 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition disabled:opacity-50"
          >
            {isLoggingOut ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-border border-t-accent" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
