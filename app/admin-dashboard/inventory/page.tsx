'use client'

import { useState, useEffect } from 'react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { createClient } from '@/lib/supabase/client'
import { PackagePlus, Send, Archive } from 'lucide-react'

export default function InventoryPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  
  const [newItemName, setNewItemName] = useState('')
  const [newItemUnit, setNewItemUnit] = useState('kg')
  
  const [allocItemId, setAllocItemId] = useState('')
  const [allocBranchId, setAllocBranchId] = useState('')
  const [allocQty, setAllocQty] = useState('')

  useEffect(() => {
    async function load() {
      const { data: inv } = await supabase.from('inventory_items').select('*').order('name')
      const { data: br } = await supabase.from('branches').select('*').order('name')
      if (inv) setItems(inv)
      if (br) {
        setBranches(br)
        if (br.length > 0) setAllocBranchId(br[0].id)
      }
      if (inv && inv.length > 0) setAllocItemId(inv[0].id)
      setLoading(false)
    }
    load()
  }, [supabase])

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemName) return
    const { data, error } = await supabase.from('inventory_items').insert({
      name: newItemName,
      unit: newItemUnit,
      total_quantity: 0
    }).select()
    
    if (!error && data) {
      setItems([...items, data[0]])
      setNewItemName('')
      if (!allocItemId) setAllocItemId(data[0].id)
      alert("Item added successfully!")
    } else {
      alert("Failed to add item. " + (error?.message || ''))
    }
  }

  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!allocItemId || !allocBranchId || !allocQty) return
    
    const qtyNum = parseFloat(allocQty)
    if (isNaN(qtyNum) || qtyNum <= 0) return alert("Invalid quantity")

    const { error } = await supabase.from('inventory_allocations').insert({
      item_id: allocItemId,
      branch_id: allocBranchId,
      quantity: qtyNum
    })

    if (!error) {
      alert("Inventory allocated successfully!")
      setAllocQty('')
    } else {
      alert("Allocation failed. " + error.message)
    }
  }

  if (loading) {
    return <div className="flex min-h-screen bg-background items-center justify-center">Loading Inventory...</div>
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="bg-card border-b border-border sticky top-0 z-10">
          <div className="px-8 py-6">
            <h1 className="font-heading text-3xl font-bold text-accent">Inventory Management</h1>
            <p className="text-muted-foreground mt-1">Track raw materials and distribute stock to branches.</p>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Add New Item */}
          <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg bg-primary/20 text-primary">
                <Archive className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold">Add Inventory Item</h2>
            </div>
            
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Item Name</label>
                <input 
                  type="text" 
                  maxLength={50}
                  value={newItemName}
                  onChange={e => setNewItemName(e.target.value)}
                  placeholder="e.g. Cheese, Chicken, Pizza Boxes"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Unit of Measurement</label>
                <select 
                  value={newItemUnit}
                  onChange={e => setNewItemUnit(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="liters">Liters (L)</option>
                  <option value="boxes">Boxes</option>
                  <option value="units">Units / Pieces</option>
                </select>
              </div>
              <button type="submit" className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground font-bold py-2 rounded-md hover:bg-primary/90 transition">
                <PackagePlus className="w-5 h-5" /> Add to Master Inventory
              </button>
            </form>
          </section>

          {/* Allocate to Branch */}
          <section className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg bg-accent/20 text-accent">
                <Send className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold">Dispatch to Branch</h2>
            </div>
            
            <form onSubmit={handleAllocate} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Select Item</label>
                <select 
                  value={allocItemId}
                  onChange={e => setAllocItemId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  {items.map(item => (
                    <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Select Branch</label>
                <select 
                  value={allocBranchId}
                  onChange={e => setAllocBranchId(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  {branches.map(br => (
                    <option key={br.id} value={br.id}>{br.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Quantity</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  max="999999"
                  value={allocQty}
                  onChange={e => setAllocQty(e.target.value)}
                  placeholder="Amount to send"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                />
              </div>
              <button type="submit" className="flex items-center justify-center gap-2 w-full bg-accent text-accent-foreground font-bold py-2 rounded-md hover:bg-accent/90 transition">
                <Send className="w-5 h-5" /> Dispatch Stock
              </button>
            </form>
          </section>

          {/* Current Master Inventory Table */}
          <section className="xl:col-span-2 bg-card border border-border rounded-xl p-6 shadow-sm mt-4">
            <h2 className="text-xl font-bold mb-4">Master Inventory Status</h2>
            {items.length === 0 ? (
              <p className="text-muted-foreground text-sm">No items in inventory. Add some above.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-secondary text-muted-foreground">
                    <tr>
                      <th className="px-6 py-3 rounded-tl-lg">Item Name</th>
                      <th className="px-6 py-3">Unit</th>
                      <th className="px-6 py-3 rounded-tr-lg">Total Master Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(item => (
                      <tr key={item.id} className="border-b border-border">
                        <td className="px-6 py-4 font-semibold">{item.name}</td>
                        <td className="px-6 py-4">{item.unit}</td>
                        <td className="px-6 py-4">{item.total_quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  )
}
