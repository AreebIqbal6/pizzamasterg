"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { createClient } from "@/lib/supabase/client"
import { Edit2, Save, X } from "lucide-react"

type MenuItem = {
  id: string
  name: string
  description: string
  price: string
  category: string
}

export default function MenuEditorPage() {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPrice, setEditPrice] = useState("")
  const [saving, setSaving] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchMenu()
  }, [])

  const fetchMenu = async () => {
    setLoading(true)
    const { data, error } = await supabase.from("menu_items").select("*").order("name")
    if (data) setItems(data)
    setLoading(false)
  }

  const handleEdit = (item: MenuItem) => {
    setEditingId(item.id)
    setEditPrice(item.price)
  }

  const handleSave = async (id: string) => {
    setSaving(true)
    const { error } = await supabase
      .from("menu_items")
      .update({ price: editPrice })
      .eq("id", id)
    
    if (!error) {
      setItems(prev => prev.map(item => item.id === id ? { ...item, price: editPrice } : item))
      setEditingId(null)
    } else {
      alert("Failed to save price.")
    }
    setSaving(false)
  }

  const categories = Array.from(new Set(items.map(item => item.category)))
  const categoryOrder = ["Special Flavours", "Standard Flavours", "Deals", "Extra Toppings"]
  categories.sort((a, b) => {
    const idxA = categoryOrder.indexOf(a)
    const idxB = categoryOrder.indexOf(b)
    if (idxA !== -1 && idxB !== -1) return idxA - idxB
    if (idxA !== -1) return -1
    if (idxB !== -1) return 1
    return a.localeCompare(b)
  })

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="bg-card border-b border-border sticky top-0 z-10">
          <div className="px-8 py-6">
            <h1 className="font-heading text-3xl font-bold text-accent">Menu Editor</h1>
            <p className="text-muted-foreground mt-1">Update prices directly on the live website.</p>
          </div>
        </div>

        <div className="p-8">
          {loading ? (
            <div className="flex justify-center p-12">Loading menu...</div>
          ) : (
            <div className="space-y-12">
              {categories.map((category) => {
                const catItems = items.filter(i => i.category === category)
                return (
                  <div key={category}>
                    <h2 className="mb-6 font-heading text-2xl font-bold uppercase tracking-tight text-foreground">
                      {category}
                    </h2>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {catItems.map((item) => (
                        <div key={item.id} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition hover:shadow-md">
                          <div className="relative aspect-video w-full bg-secondary/50 p-6 flex justify-center items-center">
                            <Image
                              src={category.includes("Flavours") ? "/food/pizza.png" : (category === "Deals" ? "/food/deal.png" : "/food/toppings.png")}
                              alt={item.name}
                              width={150}
                              height={150}
                              className="object-contain drop-shadow-2xl"
                            />
                          </div>
                          <div className="flex flex-1 flex-col p-5">
                            <h3 className="font-heading text-lg font-bold leading-tight">{item.name}</h3>
                            <p className="mt-1 flex-1 text-sm text-muted-foreground line-clamp-2">{item.description}</p>
                            
                            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                              {editingId === item.id ? (
                                <div className="flex w-full gap-2">
                                  <div className="relative flex-1">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">Rs.</span>
                                    <input
                                      type="number"
                                      value={editPrice}
                                      onChange={(e) => setEditPrice(e.target.value)}
                                      className="w-full rounded-md border border-accent bg-background pl-9 pr-2 py-1.5 font-bold focus:outline-none focus:ring-1 focus:ring-accent"
                                    />
                                  </div>
                                  <button
                                    onClick={() => handleSave(item.id)}
                                    disabled={saving}
                                    className="flex items-center justify-center rounded-md bg-green-500 px-3 text-white hover:bg-green-600 disabled:opacity-50"
                                  >
                                    <Save className="h-4 w-4" />
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="flex items-center justify-center rounded-md bg-secondary px-3 text-foreground hover:bg-border"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="font-bold text-accent text-lg">Rs. {Number(item.price).toLocaleString()}</span>
                                  <button
                                    onClick={() => handleEdit(item)}
                                    className="flex items-center gap-2 rounded-md bg-primary/10 px-3 py-1.5 text-sm font-semibold text-primary hover:bg-primary hover:text-primary-foreground transition"
                                  >
                                    <Edit2 className="h-4 w-4" /> Edit
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
