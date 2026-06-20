"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { MapPin, ChevronDown, ShoppingBag, User, LogOut, FileText } from "lucide-react"
import { useStore } from "@/components/cart/cart-context"

type Props = {
  location: string
  onChangeLocation?: () => void
}

export function SiteHeader({ location, onChangeLocation }: Props) {
  const { itemCount, openOverlay, user, signOut } = useStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card text-card-foreground">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-4">
          <Image
            src="/chef-logo-removebg-preview.png"
            alt="Pizza Master G"
            width={56}
            height={56}
            className="h-12 w-12 rounded-full bg-background object-contain p-0.5 ring-2 ring-accent"
          />
          <div className="leading-tight">
            <div className="font-heading text-lg font-extrabold text-accent">Pizza Master G</div>
            <div className="hidden text-[11px] font-bold uppercase tracking-wide text-primary sm:block">
              Karachi Ka Best Pizza
            </div>
          </div>
          <button onClick={onChangeLocation} className="ml-2 hidden items-center gap-2 border-l border-border pl-4 text-left transition hover:opacity-80 md:flex">
            <MapPin className="h-5 w-5 text-accent" />
            <div className="leading-tight">
              <div className="flex items-center gap-1 text-sm font-bold">
                Delivery to <ChevronDown className="h-4 w-4" />
              </div>
              <div className="text-xs font-normal text-muted-foreground">{location}</div>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            onClick={() => openOverlay("cart")}
            aria-label="Open cart"
            className="relative rounded-full p-1 transition hover:text-accent"
          >
            <ShoppingBag className="h-6 w-6" />
            {itemCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {itemCount}
              </span>
            )}
          </button>

          {user ? (
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-accent transition hover:opacity-80"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-lg font-bold text-accent">
                    {user.email ? user.email.charAt(0).toUpperCase() : "U"}
                  </span>
                )}
              </button>
              
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-card py-2 shadow-xl">
                  <div className="border-b border-border px-4 pb-2 pt-1">
                    <p className="truncate text-sm font-bold">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      openOverlay("orders")
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm font-semibold hover:bg-secondary"
                  >
                    <FileText className="h-4 w-4" />
                    Orders
                  </button>
                  
                  <button
                    onClick={() => {
                      setMenuOpen(false)
                      signOut()
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-secondary"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => openOverlay("auth")}
              className="rounded-full border border-accent px-5 py-2 text-sm font-bold text-accent transition hover:bg-accent hover:text-accent-foreground"
            >
              Sign In / Register
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
