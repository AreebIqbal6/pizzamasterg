"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { KitchenHeader } from "@/components/kitchen/kitchen-header"
import { Users, Plus, CheckCircle, XCircle, Trash2, Loader2 } from "lucide-react"
import { addRider, toggleRiderStatus, deleteRider } from "@/app/actions/riders"
import { toast } from "sonner"
import Link from "next/link"
import { resolveKitchenBranch } from "@/lib/auth/branch"

type Rider = {
  id: string
  name: string
  phone: string
  branch_id: string
  is_active: boolean
  created_at: string
}

export default function ManageRidersPage() {
  const [selectedBranch, setSelectedBranch] = useState("Loading...")
  const [branchId, setBranchId] = useState<string | null>(null)
  const [riders, setRiders] = useState<Rider[]>([])
  const [loading, setLoading] = useState(true)

  // Form State
  const [newName, setNewName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null)

  const supabase = createClient()

  const fetchRiders = async (bId: string) => {
    const { data, error } = await supabase
      .from("riders")
      .select("*")
      .eq("branch_id", bId)
      .order("name")
    
    if (!error && data) {
      setRiders(data)
    }
  }

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/kitchen-login'
        return
      }

      const branch = await resolveKitchenBranch(supabase, user)
      if (!branch) {
        setSelectedBranch("No Branch Assigned")
        setLoading(false)
        return
      }
        
      setBranchId(branch.id)
      setSelectedBranch(branch.name || "Assigned Branch")
      await fetchRiders(branch.id)
      setLoading(false)
    }
    init()
  }, [supabase])

  const handleAddRider = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!branchId || !newName || !newPhone) return
    setIsAdding(true)

    try {
      await addRider({ name: newName, phone: newPhone, branch_id: branchId })
      toast.success(`Rider ${newName} added successfully!`)
      setNewName("")
      setNewPhone("")
      await fetchRiders(branchId)
    } catch (err: any) {
      toast.error(err.message || "Failed to add rider")
    } finally {
      setIsAdding(false)
    }
  }

  const handleToggle = async (riderId: string, currentStatus: boolean) => {
    setLoadingActionId(riderId)
    try {
      await toggleRiderStatus(riderId, currentStatus)
      toast.success("Rider status updated")
      if (branchId) await fetchRiders(branchId)
    } catch (err: any) {
      toast.error(err.message || "Failed to update status")
    } finally {
      setLoadingActionId(null)
    }
  }

  const handleDelete = async (riderId: string) => {
    if (!confirm("Are you sure you want to permanently delete this rider?")) return
    setLoadingActionId(riderId)
    try {
      await deleteRider(riderId)
      toast.success("Rider deleted")
      if (branchId) await fetchRiders(branchId)
    } catch (err: any) {
      toast.error(err.message || "Failed to delete rider")
    } finally {
      setLoadingActionId(null)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <KitchenHeader selectedBranch={selectedBranch} />

      <main className="mx-auto max-w-4xl px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-accent flex items-center gap-2">
              <Users className="h-6 w-6" />
              Manage Riders
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Add and manage delivery riders for {selectedBranch}
            </p>
          </div>
          <Link href="/kitchen-dashboard" className="text-sm font-semibold text-accent hover:underline">
            &larr; Back to Dashboard
          </Link>
        </div>

        {/* Add Rider Form */}
        <div className="mb-10 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-accent" /> Add New Rider
          </h3>
          <form onSubmit={handleAddRider} className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="text-sm font-semibold mb-1.5 block">Full Name</label>
              <input
                required
                type="text"
                placeholder="e.g. Ali Khan"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
            </div>
            <div className="flex-1 w-full">
              <label className="text-sm font-semibold mb-1.5 block">Phone Number</label>
              <input
                required
                type="text"
                placeholder="03xx-xxxxxxx"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
              />
            </div>
            <button
              disabled={isAdding || !branchId}
              type="submit"
              className="w-full sm:w-auto rounded-md bg-accent px-6 py-2 text-sm font-bold text-accent-foreground hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center h-10"
            >
              {isAdding ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Rider"}
            </button>
          </form>
        </div>

        {/* Riders List */}
        <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-secondary/50 border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold">Name</th>
                <th className="px-6 py-3 text-left text-sm font-semibold">Phone</th>
                <th className="px-6 py-3 text-center text-sm font-semibold">Status</th>
                <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {riders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground text-sm">
                    No riders found. Add one above.
                  </td>
                </tr>
              ) : (
                riders.map((rider) => (
                  <tr key={rider.id} className="border-b border-border hover:bg-secondary/20 transition">
                    <td className="px-6 py-4 text-sm font-bold text-foreground capitalize">{rider.name}</td>
                    <td className="px-6 py-4 text-sm text-muted-foreground font-mono">{rider.phone}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${rider.is_active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {rider.is_active ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                        {rider.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          disabled={loadingActionId === rider.id}
                          onClick={() => handleToggle(rider.id, rider.is_active)}
                          className="px-3 py-1.5 text-xs font-bold rounded-md border border-border hover:bg-secondary transition disabled:opacity-50 flex items-center justify-center w-24"
                        >
                          {loadingActionId === rider.id ? <Loader2 className="h-3 w-3 animate-spin" /> : (rider.is_active ? "Deactivate" : "Activate")}
                        </button>
                        <button
                          disabled={loadingActionId === rider.id}
                          onClick={() => handleDelete(rider.id)}
                          className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  )
}
