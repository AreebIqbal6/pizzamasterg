"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { getSafeNextPath, isAdminAuthUser, isKitchenAuthUser, normalizeEmail } from "@/lib/auth/access"
import Image from "next/image"

function KitchenLoginContent() {
  const searchParams = useSearchParams()
  const [email, setEmail] = useState(() => searchParams.get("email") || "")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const nextPath = getSafeNextPath(searchParams.get("next"), "/kitchen-dashboard")
  
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      await supabase.auth.signOut()
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      
      if (signInError) {
        throw signInError
      }

      const userEmail = normalizeEmail(data.user?.email)
      const { data: branchByEmail } = await supabase
        .from('branches')
        .select('id')
        .eq('email', userEmail)
        .maybeSingle()
      
      const isAdmin = isAdminAuthUser(data.user)
      const isKitchen = isKitchenAuthUser(data.user) || !!branchByEmail

      if (!isAdmin && !isKitchen) {
        await supabase.auth.signOut()
        throw new Error("Access Denied: Incorrect Role")
      }

      router.refresh()
      if (isAdmin && !nextPath.startsWith('/kitchen-dashboard')) {
        router.push('/admin-dashboard')
      } else if (nextPath.startsWith('/admin-dashboard') && !isAdmin) {
        router.push('/kitchen-dashboard')
      } else {
        router.push(nextPath)
      }
    } catch (err: any) {
      console.error(err)
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/chef-logo-removebg-preview.png"
            alt="Pizza Master G"
            width={80}
            height={80}
            className="h-20 w-20 rounded-full bg-background object-contain p-1 ring-2 ring-accent"
          />
          <h1 className="mt-4 font-heading text-2xl font-bold text-accent">
            Kitchen Portal
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in to access your branch dashboard
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4" suppressHydrationWarning>
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="email">Branch Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="branch@pizzamaster.com"
              suppressHydrationWarning
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Enter password"
              suppressHydrationWarning
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-md bg-accent py-3 text-sm font-bold text-accent-foreground hover:opacity-90 transition disabled:opacity-50"
            suppressHydrationWarning
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {error && (
          <div className="mt-4 rounded-md bg-destructive/15 p-3 text-center text-sm font-medium text-destructive border border-destructive/30">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}

export default function KitchenLogin() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <KitchenLoginContent />
    </Suspense>
  )
}
