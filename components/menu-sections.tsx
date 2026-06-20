"use client"

import { Category, imageForCategory } from "@/lib/menu-data"
import { ProductCard } from "@/components/product-card"

type Props = {
  categories: Category[]
  registerRef: (id: string, el: HTMLElement | null) => void
}

export function MenuSections({ categories, registerRef }: Props) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      {categories.map((cat) => (
        <section
          key={cat.id}
          id={cat.id}
          ref={(el) => registerRef(cat.id, el)}
          className="scroll-mt-44 py-5"
        >
          <h2 className="text-2xl font-extrabold text-accent">{cat.title}</h2>
          {cat.note && <p className="mb-4 mt-1 text-sm font-semibold text-primary">{cat.note}</p>}
          {!cat.note && <div className="mb-4" />}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {cat.products.map((product, i) => (
              <ProductCard
                key={`${cat.id}-${i}`}
                product={product}
                image={imageForCategory(cat.id)}
                catId={cat.id}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
