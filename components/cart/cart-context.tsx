"use client"

import { createContext, useContext, useMemo, useState, useEffect, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

export type CartItem = {
  id: string
  name: string
  description?: string
  price: number
  image: string
  qty: number
}

export type AuthUser = {
  id: string
  name: string
  email: string
  phone: string
  avatar?: string
}

type Overlay = "cart" | "auth" | "checkout" | "account" | "orders" | null

const PROMO_CODE = "MASTER20"
const PROMO_RATE = 0.2

type StoreContextType = {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "qty">) => void
  removeItem: (id: string) => void
  increment: (id: string) => void
  decrement: (id: string) => void
  clearCart: () => void
  itemCount: number
  subtotal: number
  // promo
  promoApplied: boolean
  promoError: string
  applyPromo: (code: string) => Promise<void>
  removePromo: () => void
  discount: number
  promoRate: number
  total: number
  referralCode: string
  // auth
  user: AuthUser | null
  signIn: (user: AuthUser) => void
  signOut: () => void
  // overlays
  overlay: Overlay
  openOverlay: (o: Overlay) => void
  closeOverlay: () => void
}

const StoreContext = createContext<StoreContextType | null>(null)

import { validatePromoCode } from "@/app/actions/promo"

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [promoApplied, setPromoApplied] = useState(false)
  const [promoError, setPromoError] = useState("")
  const [promoRate, setPromoRate] = useState(0)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [overlay, setOverlay] = useState<Overlay>(null)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem("pmg_cart")
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart))
      } catch (e) {
        console.error("Failed to parse cart", e)
      }
    }
  }, [])

  // Save cart to localStorage on changes
  useEffect(() => {
    localStorage.setItem("pmg_cart", JSON.stringify(items))
  }, [items])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user: sessionUser } }) => {
      if (sessionUser) {
        const role = sessionUser.user_metadata?.role
        if (role === 'admin' || role === 'kitchen' || role === 'kitchen_staff') {
          setUser(null)
          return
        }
        setUser({
          id: sessionUser.id,
          name: sessionUser.user_metadata?.full_name || sessionUser.email?.split("@")[0] || "User",
          email: sessionUser.email || "",
          phone: sessionUser.phone || "",
          avatar: sessionUser.user_metadata?.avatar_url || sessionUser.user_metadata?.picture || "",
        })
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const role = session.user.user_metadata?.role
        if (role === 'admin' || role === 'kitchen' || role === 'kitchen_staff') {
          setUser(null)
          return
        }
        setUser({
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email?.split("@")[0] || "User",
          email: session.user.email || "",
          phone: session.user.phone || "",
          avatar: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || "",
        })
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const addItem = (item: Omit<CartItem, "qty">) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id)
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i))
      }
      return [...prev, { ...item, qty: 1 }]
    })
    setOverlay("cart")
  }

  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id))

  const increment = (id: string) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i)))

  const decrement = (id: string) =>
    setItems((prev) =>
      prev.flatMap((i) => {
        if (i.id !== id) return [i]
        if (i.qty <= 1) return []
        return [{ ...i, qty: i.qty - 1 }]
      }),
    )

  const clearCart = () => setItems([])

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items])
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.price * i.qty, 0), [items])

  const applyPromo = async (code: string) => {
    if (!code.trim()) {
      setPromoError("Enter a promo code.")
      return
    }
    
    // Legacy referral code check
    if (code.trim().toUpperCase() === PROMO_CODE || code.includes(`-${PROMO_CODE}`)) {
      setPromoApplied(true)
      setPromoRate(PROMO_RATE)
      setPromoError("")
      return
    }

    try {
      const res = await validatePromoCode(code)
      if (res.valid && res.discount_percentage) {
        setPromoApplied(true)
        setPromoRate(res.discount_percentage / 100)
        setPromoError("")
      } else {
        setPromoApplied(false)
        setPromoRate(0)
        setPromoError(res.message || "Invalid promo code.")
      }
    } catch (e) {
      setPromoApplied(false)
      setPromoRate(0)
      setPromoError("Failed to validate promo code.")
    }
  }

  const removePromo = () => {
    setPromoApplied(false)
    setPromoRate(0)
    setPromoError("")
  }

  const discount = promoApplied ? Math.round(subtotal * promoRate) : 0
  const total = Math.max(0, subtotal - discount)

  const signIn = (u: AuthUser) => {
    setUser(u)
    setOverlay(null)
  }
  const signOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
  }

  const referralCode = useMemo(() => {
    const base = user?.name?.split(" ")[0]?.toUpperCase() || "FRIEND"
    return `${base}-${PROMO_CODE}`
  }, [user])

  return (
    <StoreContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        increment,
        decrement,
        clearCart,
        itemCount,
        subtotal,
        promoApplied,
        promoError,
        applyPromo,
        removePromo,
        discount,
        promoRate,
        total,
        referralCode,
        user,
        signIn,
        signOut,
        overlay,
        openOverlay: setOverlay,
        closeOverlay: () => setOverlay(null),
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error("useStore must be used within CartProvider")
  return ctx
}

export function formatPrice(n: number) {
  return `Rs. ${n.toLocaleString("en-PK")}`
}

export { PROMO_CODE }
