"use client"

import { X } from "lucide-react"
import Image from "next/image"
import { useStore } from "@/components/cart/cart-context"
import { OTPForm } from "@/components/auth/otp-form"
import { OAuthButtons } from "@/components/auth/oauth-buttons"

export function AuthModal() {
  const { overlay, closeOverlay } = useStore()
  const open = overlay === "auth"

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div onClick={closeOverlay} className="absolute inset-0 bg-black/60" />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-2xl">
        <button
          onClick={closeOverlay}
          aria-label="Close"
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-5 flex flex-col items-center text-center">
          <Image
            src="/chef-logo-removebg-preview.png"
            alt="Pizza Master G"
            width={64}
            height={64}
            className="h-16 w-16 rounded-full bg-background object-contain p-0.5 ring-2 ring-accent"
          />
          <h2 className="mt-3 font-heading text-xl font-bold text-accent">
            Welcome Back
          </h2>
          <p className="text-sm text-muted-foreground">
            Sign in to order your favourite pizzas
          </p>
        </div>



        <OTPForm redirectUrl="/?openCheckout=true" openCart="false" />
        <OAuthButtons redirectUrl="/?openCheckout=true" />

      </div>
    </div>
  )
}
