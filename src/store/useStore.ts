import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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

interface StoreState {
  // Cart
  items: CartItem[]
  addItem: (item: Omit<CartItem, "qty">) => void
  removeItem: (id: string) => void
  increment: (id: string) => void
  decrement: (id: string) => void
  clearCart: () => void

  // Promo
  promoApplied: boolean
  promoError: string
  promoRate: number
  applyPromo: (code: string) => Promise<void>
  removePromo: () => void

  // User
  user: AuthUser | null
  setUser: (user: AuthUser | null) => void
  signOut: () => Promise<void>

  // UI / Overlays
  overlay: Overlay
  openOverlay: (o: Overlay) => void
  closeOverlay: () => void
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      items: [],
      promoApplied: false,
      promoError: "",
      promoRate: 0,
      user: null,
      overlay: null,

      addItem: (item) => set((state) => {
        const existing = state.items.find((i) => i.id === item.id)
        if (existing) {
          return {
            items: state.items.map((i) =>
              i.id === item.id ? { ...i, qty: i.qty + 1 } : i
            ),
            overlay: "cart"
          }
        }
        return { items: [...state.items, { ...item, qty: 1 }], overlay: "cart" }
      }),

      removeItem: (id) => set((state) => ({
        items: state.items.filter((i) => i.id !== id)
      })),

      increment: (id) => set((state) => ({
        items: state.items.map((i) =>
          i.id === id ? { ...i, qty: i.qty + 1 } : i
        )
      })),

      decrement: (id) => set((state) => ({
        items: state.items.flatMap((i) => {
          if (i.id !== id) return [i]
          if (i.qty <= 1) return []
          return [{ ...i, qty: i.qty - 1 }]
        })
      })),

      clearCart: () => set({ items: [] }),

      applyPromo: async (code) => {
        // Simple client-side check for now, can be replaced with API call
        if (!code.trim()) {
          set({ promoError: "Enter a promo code." })
          return
        }
        if (code.trim().toUpperCase() === "MASTER20" || code.includes("-MASTER20")) {
          set({ promoApplied: true, promoRate: 0.2, promoError: "" })
        } else {
          set({ promoApplied: false, promoRate: 0, promoError: "Invalid promo code." })
        }
      },

      removePromo: () => set({ promoApplied: false, promoRate: 0, promoError: "" }),

      setUser: (user) => set({ user }),
      signOut: async () => {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        await supabase.auth.signOut()
        set({ user: null })
      },

      openOverlay: (overlay) => set({ overlay }),
      closeOverlay: () => set({ overlay: null }),
    }),
    {
      name: 'pmg-storage',
      // Only persist cart items to avoid persisting sensitive user data or ui state
      partialize: (state) => ({ items: state.items }),
    }
  )
)

export const useCartTotals = () => {
  const items = useStore((state) => state.items)
  const promoRate = useStore((state) => state.promoRate)
  
  const itemCount = items.reduce((sum, i) => sum + i.qty, 0)
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const discount = Math.round(subtotal * promoRate)
  const total = Math.max(0, subtotal - discount)
  
  return { itemCount, subtotal, discount, total }
}

export function formatPrice(n: number) {
  return `Rs. ${n.toLocaleString("en-PK")}`
}
