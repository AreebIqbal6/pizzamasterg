"use client"

import { useState } from "react"
import { Eye, EyeOff, Plus, Pencil, Trash2 } from "lucide-react"
import { addKitchen, updateKitchen, deleteKitchen } from "./actions"

export default function KitchenList({ initialKitchens }: { initialKitchens: any[] }) {
  const [kitchens, setKitchens] = useState(initialKitchens)
  const [showPassword, setShowPassword] = useState<Record<string, boolean>>({})
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const togglePassword = (id: string) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const handleOpenModal = (kitchen?: any) => {
    setError("")
    if (kitchen) {
      setEditingId(kitchen.id)
      setName(kitchen.name || "")
      setLocation(kitchen.location || "")
      setEmail(kitchen.email || "")
      setPassword(kitchen.password !== "Not Set" ? kitchen.password : "")
    } else {
      setEditingId(null)
      setName("")
      setLocation("")
      setEmail("")
      setPassword("")
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData()
    formData.append("name", name)
    formData.append("location", location)
    formData.append("email", email)
    formData.append("password", password)

    try {
      if (editingId) {
        formData.append("id", editingId)
        formData.append("has_account", "true")
        const res = await updateKitchen(formData)
        if (res.error) throw new Error(res.error)
      } else {
        const res = await addKitchen(formData)
        if (res.error) throw new Error(res.error)
      }
      
      // We would normally re-fetch from server here, but for simplicity we reload
      window.location.reload()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this kitchen and its account completely?")) return
    
    setLoading(true)
    try {
      const res = await deleteKitchen(id)
      if (res.error) throw new Error(res.error)
      window.location.reload()
    } catch (err: any) {
      alert("Error deleting: " + err.message)
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <h3 className="text-xl font-bold text-foreground">Active Kitchens</h3>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-accent text-accent-foreground px-4 py-2 rounded-lg font-bold hover:opacity-90 transition"
        >
          <Plus className="h-4 w-4" />
          Add Kitchen
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-card-foreground">
            <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-6 py-4 font-semibold">Branch Name</th>
                <th className="px-6 py-4 font-semibold">Location</th>
                <th className="px-6 py-4 font-semibold">Email</th>
                <th className="px-6 py-4 font-semibold">Password</th>
                <th className="px-6 py-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {kitchens.map((kitchen) => (
                <tr key={kitchen.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 font-medium">{kitchen.name}</td>
                  <td className="px-6 py-4">{kitchen.location}</td>
                  <td className="px-6 py-4">{kitchen.email}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="font-mono bg-muted px-2 py-1 rounded">
                        {showPassword[kitchen.id] ? kitchen.password : "••••••••"}
                      </span>
                      <button 
                        onClick={() => togglePassword(kitchen.id)}
                        className="text-muted-foreground hover:text-foreground transition"
                      >
                        {showPassword[kitchen.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button 
                        onClick={() => handleOpenModal(kitchen)}
                        className="p-2 text-accent hover:bg-accent/10 rounded-lg transition"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(kitchen.id)}
                        className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {kitchens.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                    No kitchens found. Add one to get started!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className="bg-card w-full max-w-md rounded-2xl border border-border shadow-2xl p-6">
            <h3 className="text-xl font-bold text-accent mb-4">
              {editingId ? "Edit Kitchen" : "Add New Kitchen"}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Branch Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  placeholder="e.g. Mukka Chowk Branch"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Location</label>
                <input 
                  type="text" 
                  value={location} 
                  onChange={(e) => setLocation(e.target.value)} 
                  required
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  placeholder="e.g. Azizabad Mukka Chowk"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email Address</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  placeholder="kitchen@pizzamasterg.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Password</label>
                <input 
                  type="text" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required={!editingId}
                  className="w-full mt-1 px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-accent outline-none"
                  placeholder="e.g. pizza123"
                />
                {editingId && <p className="text-xs text-muted-foreground mt-1">Leave as is to keep the current password, or type to change it.</p>}
              </div>

              {error && <p className="text-sm text-destructive font-medium bg-destructive/10 p-2 rounded">{error}</p>}

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-muted-foreground hover:text-foreground transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  className="px-4 py-2 font-bold bg-accent text-accent-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition"
                >
                  {loading ? "Saving..." : "Save Kitchen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
