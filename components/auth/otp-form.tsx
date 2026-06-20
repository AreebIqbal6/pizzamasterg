"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendOtpToCustomer as sendOtp, verifyOtpAction } from '@/app/actions/otp'

const ADMIN_EMAILS = ['admin@pizzamasterg.com']

export function OTPForm({ redirectUrl, openCart }: { redirectUrl: string, openCart: string }) {
  const [step, setStep] = useState<"email" | "code" | "password">("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // 1. Admin Check: Don't send OTP, go straight to Password
    if (ADMIN_EMAILS.includes(email.toLowerCase())) {
      setStep("password")
      setLoading(false)
      return
    }

    // 2. Kitchen & Customers: Send OTP
    try {
      const cleanInput = email.trim()
      if (cleanInput.includes('@')) {
        // Real Supabase Email OTP
        const supabase = createClient()
        const { error } = await supabase.auth.signInWithOtp({
          email: cleanInput,
          options: { shouldCreateUser: true }
        })
        if (error) {
          setError(error.message)
        } else {
          setStep("code")
        }
      } else {
        // Simulated Phone OTP
        const res = await sendOtp(cleanInput)
        if (res.error) {
          setError(res.error)
        } else {
          setStep("code")
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to send code")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const cleanToken = code.trim()
      const cleanEmail = email.trim()
      const supabase = createClient()

      let authError = null;
      let data: any = null;

      if (cleanEmail.includes('@')) {
        // 1a. Native Supabase Email OTP
        const res = await supabase.auth.verifyOtp({
          email: cleanEmail,
          token: cleanToken,
          type: 'email',
        })
        authError = res.error
        data = res.data

        // 1b. Fallback to password for email
        if (authError) {
          const { error: passwordError, data: passwordData } = await supabase.auth.signInWithPassword({
            email: cleanEmail,
            password: cleanToken
          })
          if (passwordError) {
            setError("Invalid code or backup password. Please try again.")
            setLoading(false)
            return
          }
          data = passwordData as any
        }
      } else {
        // 2. Custom Phone OTP Simulation
        const verifyRes = await verifyOtpAction(cleanEmail, cleanToken)
        if (!verifyRes.success) {
          setError(verifyRes.error || "Invalid code.")
          setLoading(false)
          return
        }
        // Phone users proceed as unauthenticated guests
        data = { user: null } 
      }

      // 3. Determine redirect
      const role = data?.user?.user_metadata?.role
      const finalRedirect = redirectUrl || '/'
      
      if (role === 'admin' || cleanEmail === 'admin@pizzamasterg.com') {
        window.location.href = '/admin-dashboard'
      } else if (role === 'kitchen' || cleanEmail === 'pizzamastergmukkachowk@gmail.com') {
        window.location.href = '/kitchen-dashboard'
      } else {
        window.location.href = finalRedirect
      }

    } catch (err: any) {
      setError(err.message || "Failed to verify code")
    } finally {
      setLoading(false)
    }
  }

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const supabase = createClient()
      const { error, data } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })

      if (error) {
        setError("Invalid admin credentials.")
        setLoading(false)
        return
      }

      const role = data?.user?.user_metadata?.role
      const finalRedirect = redirectUrl || '/'
      
      if (role === 'admin' || email.trim() === 'admin@pizzamasterg.com') {
        window.location.href = '/admin-dashboard'
      } else if (role === 'kitchen' || email.trim() === 'pizzamastergmukkachowk@gmail.com') {
        window.location.href = '/kitchen-dashboard'
      } else {
        window.location.href = finalRedirect
      }
    } catch (err: any) {
      setError(err.message || "Failed to login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {step === "email" && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="email">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="email@example.com"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-accent py-2 text-sm font-bold text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Continue"}
          </button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div className="text-center text-sm text-muted-foreground mb-4">
            We sent a 6-digit code to <span className="font-bold text-foreground">{email}</span>
            <button 
              type="button" 
              onClick={() => setStep("email")}
              className="block mx-auto mt-1 text-accent hover:underline"
            >
              Change email
            </button>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="code">
              6-Digit Code (or Backup Password)
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              disabled={loading}
              className="flex h-12 w-full rounded-md border border-input bg-background px-3 py-2 text-center text-lg tracking-widest mt-1 focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="000000"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-accent py-2 text-sm font-bold text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify & Login"}
          </button>
        </form>
      )}

      {step === "password" && (
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div className="text-center text-sm text-muted-foreground mb-4">
            Admin Portal Access for <span className="font-bold text-foreground">{email}</span>
            <button 
              type="button" 
              onClick={() => setStep("email")}
              className="block mx-auto mt-1 text-accent hover:underline"
            >
              Change email
            </button>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground" htmlFor="password">
              Admin Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-accent"
              placeholder="Enter password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-accent py-2 text-sm font-bold text-accent-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Login to Admin"}
          </button>
        </form>
      )}

      {error && (
        <div className="p-3 text-sm text-center text-destructive bg-destructive/10 rounded-md">
          {typeof error === 'string' ? error : JSON.stringify(error)}
        </div>
      )}
    </div>
  )
}
