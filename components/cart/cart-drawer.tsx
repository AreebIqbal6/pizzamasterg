"use client"

import { useState } from "react"
import Image from "next/image"
import { X, Plus, Minus, Trash2, ShoppingBag, Tag, Check } from "lucide-react"
import { useStore, formatPrice } from "@/components/cart/cart-context"

export function CartDrawer() {
  const {
    items,
    overlay,
    closeOverlay,
    openOverlay,
    increment,
    decrement,
    removeItem,
    subtotal,
    promoApplied,
    promoError,
    applyPromo,
    removePromo,
    discount,
    total,
    user,
  } = useStore()

  const [code, setCode] = useState("")
  const open = overlay === "cart"

  return (
    <>
      <div
        onClick={closeOverlay}
        className={`fixed inset-0 z-50 bg-black/60 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-card text-card-foreground shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="flex items-center gap-2 font-heading text-lg font-bold text-accent">
            <ShoppingBag className="h-5 w-5" /> Your Cart
          </h2>
          <button onClick={closeOverlay} aria-label="Close cart" className="text-muted-foreground hover:text-foreground">
            <X className="h-6 w-6" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground" />
            <p className="font-semibold">Your cart is empty</p>
            <p className="text-sm text-muted-foreground">Add some delicious pizzas to get started.</p>
            <button
              onClick={closeOverlay}
              className="mt-2 rounded-full bg-accent px-5 py-2 text-sm font-bold text-accent-foreground"
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <ul className="flex flex-col gap-4">
                {items.map((item, index) => (
                  <li key={`${item.id}-${index}`} className="flex gap-3 rounded-lg border border-border bg-background p-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-secondary">
                      <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-bold leading-tight text-foreground">{item.name}</h3>
                        <button
                          onClick={() => removeItem(item.id)}
                          aria-label={`Remove ${item.name}`}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="text-xs font-semibold text-accent">{formatPrice(item.price)}</span>
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center gap-2 rounded-full border border-border">
                          <button
                            onClick={() => decrement(item.id)}
                            aria-label="Decrease quantity"
                            className="flex h-7 w-7 items-center justify-center rounded-full hover:text-accent"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="w-5 text-center text-sm font-bold">{item.qty}</span>
                          <button
                            onClick={() => increment(item.id)}
                            aria-label="Increase quantity"
                            className="flex h-7 w-7 items-center justify-center rounded-full hover:text-accent"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <span className="text-sm font-bold text-foreground">{formatPrice(item.price * item.qty)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-border px-5 py-4">
              {/* Promo */}
              {promoApplied ? (
                <div className="mb-3 flex items-center justify-between rounded-md border border-accent/40 bg-accent/10 px-3 py-2">
                  <span className="flex items-center gap-2 text-sm font-semibold text-accent">
                    <Check className="h-4 w-4" /> Discount Applied: 20%
                  </span>
                  <button onClick={removePromo} className="text-xs font-semibold text-muted-foreground hover:text-primary">
                    Remove
                  </button>
                </div>
              ) : (
                <div className="mb-3">
                  <div className="flex gap-2">
                    <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-background px-3">
                      <Tag className="h-4 w-4 text-accent" />
                      <input
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        placeholder="Referral / Promo code"
                        className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                      />
                    </div>
                    <button
                      onClick={() => applyPromo(code)}
                      className="rounded-md bg-accent px-4 py-2 text-sm font-bold text-accent-foreground"
                    >
                      Apply
                    </button>
                  </div>
                  {promoError && <p className="mt-1 text-xs font-semibold text-primary">{promoError}</p>}
                </div>
              )}

              <div className="space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="font-semibold text-foreground">{formatPrice(subtotal)}</span>
                </div>
                {promoApplied && (
                  <div className="flex justify-between text-accent">
                    <span>Discount (20%)</span>
                    <span className="font-semibold">- {formatPrice(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-border pt-2 text-base font-bold">
                  <span>Grand Total</span>
                  <span className="text-accent">{formatPrice(total)}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!user) {
                    openOverlay("auth")
                  } else {
                    openOverlay("checkout")
                  }
                }}
                className="mt-4 w-full rounded-md bg-primary py-3 text-sm font-bold text-primary-foreground transition hover:opacity-90"
              >
                Proceed to Checkout
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  )
}
