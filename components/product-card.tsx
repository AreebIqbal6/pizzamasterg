"use client"

import Image from "next/image"
import { Heart } from "lucide-react"
import { toast } from "sonner"
import type { Product } from "@/lib/menu-data"
import { useStore } from "@/components/cart/cart-context"

function parsePrice(price: string) {
  return Number(price.replace(/,/g, "")) || 0
}

export function ProductCard({ product, image, catId }: { product: Product; image: string; catId: string }) {
  const { addItem } = useStore()
  const numericPrice = parsePrice(product.price)

  const handleAdd = () => {
    addItem({
      id: `${catId}-${product.name}`,
      name: product.name,
      description: product.description,
      price: numericPrice,
      image,
    })
    toast.success(`🍕 ${product.name} added to cart!`, {
      description: `Rs. ${numericPrice} - Tap to view cart`,
    })
  }

  return (
    <div className="flex gap-4 rounded-xl border border-border bg-card p-3 shadow-sm transition hover:border-accent/50 hover:shadow-md">
      <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-secondary">
        <Image src={image || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
        {product.badge && (
          <span className="absolute bottom-1 left-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-foreground">
            {product.badge}
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="font-heading text-sm font-bold leading-tight text-accent">{product.name}</h3>
        {product.description && (
          <p className="mt-1 line-clamp-2 text-xs font-normal leading-relaxed text-muted-foreground">
            {product.description}
          </p>
        )}

        <div className="mt-auto pt-2">
          <div className="mb-2 flex w-fit items-center gap-2 rounded-md bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
            <span>
              {product.from ? "from " : ""}Rs. {product.price}
            </span>
            {product.oldPrice && (
              <span className="text-xs font-medium text-primary-foreground/70 line-through">{product.oldPrice}</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleAdd}
              className="rounded-md bg-accent px-4 py-2 text-xs font-bold text-accent-foreground transition hover:opacity-90"
            >
              Add To Cart
            </button>
            <button aria-label="Add to favourites" className="text-muted-foreground transition hover:text-accent">
              <Heart className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
