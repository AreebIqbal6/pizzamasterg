"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

export function CookieBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) {
      setShow(true)
    }
  }, [])

  if (!show) return null

  const accept = () => {
    localStorage.setItem("cookie-consent", "true")
    setShow(false)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-card p-4 shadow-2xl">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
        <div className="text-sm text-foreground">
          <p>
            We use cookies to enhance your browsing experience, serve personalized ads or content, and analyze our traffic. By clicking "Accept", you consent to our use of cookies.
          </p>
          <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
            <Link href="/privacy-policy" className="hover:text-accent underline">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-accent underline">
              Terms of Service
            </Link>
          </div>
        </div>
        <div className="flex w-full shrink-0 gap-3 md:w-auto">
          <button
            onClick={() => setShow(false)}
            className="flex-1 rounded-md border border-border bg-transparent px-4 py-2 text-sm font-bold text-foreground transition hover:bg-secondary md:flex-none"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="flex-1 rounded-md bg-accent px-6 py-2 text-sm font-bold text-accent-foreground transition hover:opacity-90 md:flex-none"
          >
            Accept Cookies
          </button>
        </div>
      </div>
    </div>
  )
}
