"use client"

import { useRef } from "react"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Category } from "@/lib/menu-data"

type Props = {
  active: string
  categories: Category[]
  onSelect: (id: string) => void
}

export function CategoryNav({ active, categories, onSelect }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 240, behavior: "smooth" })
  }

  return (
    <div className="sticky top-[72px] z-30 border-b border-border bg-card">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-2">
        <button onClick={() => scroll(-1)} className="shrink-0 p-2 text-muted-foreground" aria-label="Scroll left">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div ref={scrollRef} className="flex flex-1 gap-1 overflow-x-auto scroll-smooth py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelect(cat.id)}
              className={`relative whitespace-nowrap px-4 py-2 text-sm font-bold transition ${
                active === cat.id ? "text-accent" : "text-foreground hover:text-accent"
              }`}
            >
              {cat.title}
              {active === cat.id && <span className="absolute inset-x-2 -bottom-0.5 h-1 rounded-full bg-accent" />}
            </button>
          ))}
        </div>
        <button onClick={() => scroll(1)} className="shrink-0 p-2 text-muted-foreground" aria-label="Scroll right">
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-3">
        <div className="flex items-center gap-3 border-b border-border pb-2">
          <Search className="h-5 w-5 text-accent" />
          <input
            type="text"
            placeholder="Search for pizzas, deals & flavours"
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>
    </div>
  )
}
