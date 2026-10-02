"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { KitchenHeader } from "@/components/kitchen/kitchen-header"
import { Loader2, Search, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { resolveKitchenBranch } from "@/lib/auth/branch"

interface MenuItem {
  id: string
  name: string
  category: string
  price: number
  available: boolean // Global availability
}

interface Override {
  menu_item_id: string
  is_86ed: boolean
}

export default function KitchenMenuPage() {
  const [branchId, setBranchId] = useState<string | null>(null)
  const [branchName, setBranchName] = useState("Loading...")
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [overrides, setOverrides] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/kitchen-login'
        return
      }

      const branch = await resolveKitchenBranch(supabase, user)
      if (!branch) {
        setBranchName("No branch assigned")
        setLoading(false)
        return
      }

      setBranchId(branch.id)
      setBranchName(branch.name || "Assigned Branch")

      // Fetch all menu items
      const { data: items } = await supabase.from('menu_items').select('id, name, category, price, available').order('category')
      if (items) setMenuItems(items)

      // Fetch branch overrides
      const { data: branchOverrides } = await supabase.from('branch_menu_overrides').select('menu_item_id, is_86ed').eq('branch_id', branch.id)
      if (branchOverrides) {
        const overrideMap: Record<string, boolean> = {}
        branchOverrides.forEach(o => {
          overrideMap[o.menu_item_id] = o.is_86ed
        })
        setOverrides(overrideMap)
      }

      setLoading(false)
    }

    loadData()
  }, [supabase])

  const toggle86 = async (itemId: string, currentStatus: boolean) => {
    if (!branchId) return
    const newStatus = !currentStatus
    
    // Optimistic update
    setOverrides(prev => ({ ...prev, [itemId]: newStatus }))

    const { error } = await supabase
      .from('branch_menu_overrides')
      .upsert({ 
        branch_id: branchId, 
        menu_item_id: itemId, 
        is_86ed: newStatus,
        updated_at: new Date().toISOString()
      }, { onConflict: 'branch_id, menu_item_id' })

    if (error) {
      // Revert on error
      setOverrides(prev => ({ ...prev, [itemId]: currentStatus }))
      toast.error("Failed to update status")
      console.error(error)
    } else {
      toast.success(newStatus ? "Item 86'ed (Out of stock)" : "Item available")
    }
  }

  const filteredItems = menuItems.filter(item => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.category.toLowerCase().includes(search.toLowerCase())
  )

  const categories = Array.from(new Set(filteredItems.map(i => i.category)))

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <KitchenHeader selectedBranch={branchName} />

      <main className="mx-auto max-w-5xl p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/kitchen-dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent mb-2 transition">
              <ArrowLeft className="h-4 w-4" /> Back to Dashboard
            </Link>
            <h1 className="text-3xl font-bold font-heading text-accent">Menu & Quick 86'ing</h1>
            <p className="text-sm text-muted-foreground mt-1">Toggle items out of stock instantly for your branch.</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search items..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-border bg-card pl-9 pr-4 py-2 text-sm focus:border-accent focus:outline-none transition"
            />
          </div>
        </div>

        {!branchId ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            You must be assigned to a branch to manage its menu.
          </div>
        ) : (
          <div className="space-y-8">
            {categories.map(category => (
              <div key={category} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="bg-secondary px-5 py-3 border-b border-border">
                  <h2 className="font-bold uppercase tracking-wider">{category}</h2>
                </div>
                <div className="divide-y divide-border">
                  {filteredItems.filter(i => i.category === category).map(item => {
                    const is86ed = overrides[item.id] || false
                    const isGloballyUnavailable = !item.available
                    
                    return (
                      <div key={item.id} className="flex items-center justify-between p-5 hover:bg-secondary/20 transition">
                        <div>
                          <p className={`font-semibold ${isGloballyUnavailable ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                            {item.name}
                          </p>
                          <p className="text-sm text-muted-foreground">Rs. {item.price}</p>
                          {isGloballyUnavailable && (
                            <p className="text-xs font-bold text-red-500 mt-1">Unavailable Globally (Admin)</p>
                          )}
                        </div>
                        
                        <button
                          onClick={() => !isGloballyUnavailable && toggle86(item.id, is86ed)}
                          disabled={isGloballyUnavailable}
                          className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
                            is86ed || isGloballyUnavailable ? 'bg-red-500' : 'bg-green-500'
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              is86ed || isGloballyUnavailable ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
            
            {filteredItems.length === 0 && (
              <div className="rounded-lg border border-border bg-card p-12 text-center text-muted-foreground">
                No items found matching "{search}"
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
