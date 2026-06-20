"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import dynamic from "next/dynamic"

const ReviewModal = dynamic(() => import("./review-modal"), { ssr: false })

const branches = [
  {
    name: "Branch 1 — Mukka Chowk",
    address: "A-59, Shop# 4, Mukka Chowk, Block-8, Azizabad, Karachi.",
    phones: ["+1234567890", "+1234567890"],
  },
  {
    name: "Branch 2 — Gulshan-e-Iqbal",
    address: "Shop#2, Zubaida Classic Block-13D-2, Gulshan-e-Iqbal, Karachi.",
    phones: ["+1234567890", "+1234567890"],
  },
  {
    name: "Branch 3 — Federal B Area",
    address: "Shop#K-4/2, Zahid Square, Block-16, FB Area, Near Saghir Centre, Karachi.",
    phones: ["+1234567890", "+1234567890"],
  },
  {
    name: "Branch 4 — Gulshan-e-Iqbal Block 2",
    address: "Gulshan-e-Iqbal Block 2, Karachi.",
    phones: [],
  },
  {
    name: "Branch 5 — North Karachi Anda Mor",
    address: "North Karachi Anda Mor, Karachi.",
    phones: [],
  },
  {
    name: "Branch 6 — North Karachi 11B",
    address: "North Karachi 11B, Karachi.",
    phones: [],
  },
]

export function SiteFooter() {
  const [isReviewOpen, setIsReviewOpen] = useState(false)

  const openSocial = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <Image
            src="/chef-logo-removebg-preview.png"
            alt="Pizza Master G"
            width={88}
            height={88}
            className="h-20 w-20 rounded-full object-contain ring-2 ring-accent"
          />
          <h3 className="text-2xl font-extrabold text-accent">Pizza Master G</h3>
          <p className="text-sm font-bold uppercase tracking-wide text-primary">Karachi Ka Best Pizza</p>
          <p className="max-w-2xl text-pretty text-sm text-muted-foreground">
            Enjoy Pizza Master G — Nice to meet You. Hot, fresh and spicy pizzas made daily and delivered fast across
            Karachi from our three branches.
          </p>
        </div>

        <h4 className="mb-4 mt-10 text-lg font-extrabold text-accent">Our Branches</h4>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {branches.map((b) => (
            <div key={b.name} className="rounded-xl border border-border bg-background p-5">
              <p className="font-extrabold text-foreground">{b.name}</p>
              <p className="mt-2 text-sm text-muted-foreground">{b.address}</p>
              <div className="mt-3 space-y-1">
                {b.phones.map((p, idx) => (
                  <a
                    key={`${p}-${idx}`}
                    href={`https://wa.me/92${p.replace(/[-]/g, "").replace(/^0/, "")}`}
                    className="flex items-center gap-2 text-sm font-bold text-accent hover:underline"
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 2a8 8 0 0 1 6.9 12l-.3.5.7 2.6-2.7-.7-.5.3A8 8 0 1 1 12 4zm-3.4 4.3c-.2 0-.5 0-.7.4-.3.4-.9.9-.9 2.2s1 2.6 1.1 2.7c.1.2 1.9 3 4.7 4.1 2.3 1 2.8.8 3.3.7.5 0 1.6-.6 1.8-1.3.2-.6.2-1.2.2-1.3l-.6-.3c-.4-.2-1.6-.8-1.8-.9-.2 0-.4-.1-.6.2l-.8 1c-.2.2-.3.2-.6.1-1.7-.7-2.7-2.2-2.8-2.4-.1-.2 0-.4.1-.5l.4-.5c.1-.2.2-.3.3-.5 0-.2 0-.4 0-.5l-.8-1.9c-.2-.5-.4-.5-.6-.5z" />
                    </svg>
                    {p}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 border-t border-border pt-8 sm:grid-cols-3">
          <div className="text-sm text-muted-foreground">
            <p className="font-bold text-foreground">Our Timings</p>
            <p className="mt-2">Monday - Sunday</p>
            <p className="mt-1">12:00 PM - 03:00 AM</p>
          </div>
          <div className="text-sm text-muted-foreground sm:text-center">
            <p className="font-bold text-foreground">Feedback</p>
            <button 
              onClick={() => setIsReviewOpen(true)}
              className="mt-3 rounded-full bg-accent px-5 py-2 text-sm font-bold text-accent-foreground hover:bg-accent/90 transition shadow-sm"
            >
              Leave a Review
            </button>
          </div>
          <div className="text-sm text-muted-foreground sm:text-right">
            <p className="font-bold text-foreground">Follow Us</p>
            <div className="mt-3 flex gap-3 sm:justify-end">
              <button
                onClick={() => openSocial('https://facebook.com/pizzamasterg')}
                aria-label="Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-80 transition"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
                  <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" />
                </svg>
              </button>
              <button
                onClick={() => openSocial('https://instagram.com/pizzamasterg')}
                aria-label="Instagram"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground hover:opacity-80 transition"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                  <rect x="2" y="2" width="20" height="20" rx="5" />
                  <circle cx="12" cy="12" r="4" />
                  <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row">
          <p className="text-center sm:text-left">
            © 2026 Pizza Master G. All rights reserved. <br className="sm:hidden" />
            Powered by{" "}
            <button onClick={() => openSocial('https://skilloraofficial.com/')} className="font-bold text-accent hover:underline">
              Skillora
            </button>
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/terms" className="hover:text-accent">
              Terms and conditions
            </Link>
            <Link href="/privacy-policy" className="hover:text-accent">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-accent">
              FAQs
            </Link>
          </div>
        </div>
      </div>
      
      <ReviewModal isOpen={isReviewOpen} onClose={() => setIsReviewOpen(false)} />
    </footer>
  )
}
