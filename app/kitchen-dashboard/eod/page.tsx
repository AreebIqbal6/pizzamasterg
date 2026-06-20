"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { KitchenHeader } from "@/components/kitchen/kitchen-header"
import { Loader2, ArrowLeft, DollarSign, Calculator, CheckCircle } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { resolveKitchenBranch } from "@/lib/auth/branch"

export default function EODPage() {
  const [branchId, setBranchId] = useState<string | null>(null)
  const [branchName, setBranchName] = useState("Loading...")
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [alreadySubmitted, setAlreadySubmitted] = useState(false)

  // Calculated from today's completed orders
  const [cashExpected, setCashExpected] = useState(0)
  const [onlineTotal, setOnlineTotal] = useState(0)

  // Form state
  const [cashActual, setCashActual] = useState<number | "">("")
  const [notes, setNotes] = useState("")

  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD local time

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

      const bId = branch.id
      setBranchId(bId)
      setBranchName(branch.name || "Assigned Branch")

      // Check if already submitted today
      const { data: existingEOD } = await supabase
        .from('eod_reconciliations')
        .select('*')
        .eq('branch_id', bId)
        .eq('date', today)
        .single()

      if (existingEOD) {
        setAlreadySubmitted(true)
        setCashExpected(existingEOD.total_cash_expected)
        setOnlineTotal(existingEOD.total_online)
        setCashActual(existingEOD.total_cash_actual)
        setNotes(existingEOD.notes || "")
        setLoading(false)
        return
      }

      // Calculate today's totals
      const startOfDay = new Date()
      startOfDay.setHours(0, 0, 0, 0)
      
      const { data: orders } = await supabase
        .from('orders')
        .select('total, payment_method')
        .eq('branch_id', bId)
        .eq('status', 'completed')
        .gte('created_at', startOfDay.toISOString())

      let calculatedCash = 0
      let calculatedOnline = 0

      if (orders) {
        orders.forEach(o => {
          if (o.payment_method === 'cod') {
            calculatedCash += Number(o.total)
          } else {
            calculatedOnline += Number(o.total)
          }
        })
      }

      setCashExpected(calculatedCash)
      setOnlineTotal(calculatedOnline)
      setLoading(false)
    }

    loadData()
  }, [supabase, today])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!branchId) return
    if (cashActual === "") {
      toast.error("Please enter actual cash counted")
      return
    }

    const confirmSubmit = window.confirm("Are you sure you want to submit the End of Day report? This cannot be undone easily.")
    if (!confirmSubmit) return

    setIsSubmitting(true)

    const discrepancy = Number(cashActual) - cashExpected
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase
      .from('eod_reconciliations')
      .insert({
        branch_id: branchId,
        date: today,
        total_cash_expected: cashExpected,
        total_cash_actual: Number(cashActual),
        total_online: onlineTotal,
        discrepancy: discrepancy,
        notes: notes.trim(),
        submitted_by: user?.id
      })

    if (error) {
      toast.error("Failed to submit EOD report: " + error.message)
      console.error(error)
    } else {
      toast.success("EOD report submitted successfully")
      setAlreadySubmitted(true)
    }
    
    setIsSubmitting(false)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  const discrepancy = cashActual !== "" ? Number(cashActual) - cashExpected : 0
  const isShort = discrepancy < 0
  const isOver = discrepancy > 0

  return (
    <div className="min-h-screen bg-background pb-12">
      <KitchenHeader selectedBranch={branchName} />

      <main className="mx-auto max-w-3xl p-6">
        <div className="mb-8">
          <Link href="/kitchen-dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-accent mb-2 transition">
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold font-heading text-accent">End of Day (EOD)</h1>
          <p className="text-sm text-muted-foreground mt-1">Reconcile today's cash drawer before closing.</p>
        </div>

        {!branchId ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
            You must be assigned to a branch to submit EOD.
          </div>
        ) : (
          <div className="space-y-6">
            
            {alreadySubmitted && (
              <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-bold text-green-600">EOD Already Submitted</h3>
                  <p className="text-sm text-green-700/80 mt-1">The End of Day report for {today} has already been logged. You are viewing the submitted data.</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                  <Calculator className="h-4 w-4" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">System Expected Cash</h3>
                </div>
                <p className="text-3xl font-bold text-foreground">Rs. {cashExpected}</p>
                <p className="text-xs text-muted-foreground mt-2">Sum of all completed COD orders</p>
              </div>

              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                  <DollarSign className="h-4 w-4" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">Online Payments</h3>
                </div>
                <p className="text-3xl font-bold text-foreground">Rs. {onlineTotal}</p>
                <p className="text-xs text-muted-foreground mt-2">Sum of prepaid orders</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
              <h3 className="text-lg font-bold border-b border-border pb-3">Drawer Count</h3>
              
              <div>
                <label className="block text-sm font-semibold mb-2">Actual Cash Counted</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">Rs.</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    disabled={alreadySubmitted || isSubmitting}
                    value={cashActual}
                    onChange={(e) => setCashActual(e.target.value ? Number(e.target.value) : "")}
                    className="w-full rounded-md border border-border bg-background pl-10 pr-4 py-3 font-semibold focus:border-accent focus:outline-none transition disabled:opacity-50"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {cashActual !== "" && (
                <div className={`p-4 rounded-lg border flex items-center justify-between ${
                  isShort ? 'border-red-500/30 bg-red-500/10 text-red-600' : 
                  isOver ? 'border-yellow-500/30 bg-yellow-500/10 text-yellow-600' : 
                  'border-green-500/30 bg-green-500/10 text-green-600'
                }`}>
                  <span className="font-bold">Discrepancy</span>
                  <span className="font-bold text-lg">
                    {discrepancy > 0 ? "+" : ""}Rs. {discrepancy}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold mb-2">Notes / Explanation</label>
                <textarea
                  disabled={alreadySubmitted || isSubmitting}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full min-h-[100px] resize-none rounded-md border border-border bg-background p-3 text-sm focus:border-accent focus:outline-none transition disabled:opacity-50"
                  placeholder={isShort || isOver ? "Please explain the discrepancy..." : "Any additional notes..."}
                  required={isShort || isOver}
                />
              </div>

              {!alreadySubmitted && (
                <button
                  type="submit"
                  disabled={isSubmitting || cashActual === ""}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent py-4 font-bold text-accent-foreground shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle className="h-5 w-5" />}
                  {isSubmitting ? "Submitting..." : "Submit EOD Report"}
                </button>
              )}
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
