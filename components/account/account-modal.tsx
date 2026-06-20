"use client"

import { useState } from "react"
import { X, Copy, Check, Gift, User as UserIcon } from "lucide-react"
import { useStore } from "@/components/cart/cart-context"

export function AccountModal() {
  const { overlay, closeOverlay, user, referralCode, signOut } = useStore()
  const [copied, setCopied] = useState(false)
  const open = overlay === "account"

  if (!open || !user) return null

  const shareLink = `https://pizzamasterg.pk/join?ref=${referralCode}`

  const copy = () => {
    navigator.clipboard?.writeText(shareLink).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

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

        <h2 className="font-heading text-xl font-bold text-accent">My Dashboard</h2>

        <div className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-background p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <UserIcon className="h-6 w-6" />
          </div>
          <div className="leading-tight">
            <p className="font-bold">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            {user.phone && <p className="text-sm text-muted-foreground">{user.phone}</p>}
          </div>
        </div>

        {/* Refer a friend */}
        <div className="mt-4 rounded-lg border border-accent/40 bg-accent/10 p-4">
          <div className="flex items-center gap-2 text-accent">
            <Gift className="h-5 w-5" />
            <h3 className="font-heading font-bold">Refer a Friend</h3>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Share your code and earn a <span className="font-bold text-accent">20% discount</span> when a friend places
            their first order. They get 20% off too.
          </p>

          <div className="mt-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your code</span>
            <div className="mt-1 flex items-center justify-between rounded-md border border-border bg-background px-3 py-2">
              <span className="font-mono font-bold tracking-wide text-accent">{referralCode}</span>
            </div>
          </div>

          <div className="mt-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Shareable link</span>
            <div className="mt-1 flex gap-2">
              <input
                readOnly
                value={shareLink}
                className="w-full truncate rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground outline-none"
              />
              <button
                onClick={copy}
                className="flex shrink-0 items-center gap-1 rounded-md bg-accent px-3 py-2 text-sm font-bold text-accent-foreground"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            signOut()
            closeOverlay()
          }}
          className="mt-4 w-full rounded-md border border-border py-2.5 text-sm font-bold text-foreground transition hover:bg-secondary"
        >
          Sign Out
        </button>
      </div>
    </div>
  )
}
