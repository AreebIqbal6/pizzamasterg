'use client'

import { useState, useEffect, useMemo } from 'react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { createClient } from '@/lib/supabase/client'
import { Calculator, DollarSign, TrendingUp, TrendingDown, RefreshCcw } from 'lucide-react'

export default function CalculatorPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [totalRevenue, setTotalRevenue] = useState(0)

  // Expense Inputs
  const [ingredientsCost, setIngredientsCost] = useState<number>(0)
  const [laborCost, setLaborCost] = useState<number>(0)
  const [rentAndUtilities, setRentAndUtilities] = useState<number>(0)
  const [marketing, setMarketing] = useState<number>(0)
  const [otherExpenses, setOtherExpenses] = useState<number>(0)

  useEffect(() => {
    async function fetchRevenue() {
      // In a real scenario, this might aggregate large datasets.
      // For demonstration, we'll fetch orders and sum the total.
      const { data: orders } = await supabase.from('orders').select('total')
      if (orders) {
        const sum = orders.reduce((acc, order) => acc + Number(order.total), 0)
        setTotalRevenue(sum)
      }
      setLoading(false)
    }
    fetchRevenue()
  }, [supabase])

  const totalExpenses = useMemo(() => {
    return (ingredientsCost || 0) + (laborCost || 0) + (rentAndUtilities || 0) + (marketing || 0) + (otherExpenses || 0)
  }, [ingredientsCost, laborCost, rentAndUtilities, marketing, otherExpenses])

  const netProfit = totalRevenue - totalExpenses
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : '0.00'
  const isProfitable = netProfit >= 0

  if (loading) {
    return <div className="flex min-h-screen bg-background items-center justify-center">Loading Calculator...</div>
  }

  const formatCurrency = (val: number) => new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(val)

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="bg-card border-b border-border sticky top-0 z-10">
          <div className="px-8 py-6 flex justify-between items-center">
            <div>
              <h1 className="font-heading text-3xl font-bold text-accent">Profit Calculator</h1>
              <p className="text-muted-foreground mt-1">Real-time revenue tracking versus manual expense inputs.</p>
            </div>
            <button 
              onClick={() => {
                setIngredientsCost(0); setLaborCost(0); setRentAndUtilities(0); setMarketing(0); setOtherExpenses(0);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground hover:bg-secondary/80 rounded-lg text-sm font-semibold transition"
            >
              <RefreshCcw className="w-4 h-4" /> Reset Fields
            </button>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Expenses Input Form */}
          <section className="lg:col-span-7 bg-card border border-border rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-lg bg-primary/20 text-primary">
                <Calculator className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold">Input Expenses</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-muted-foreground">Ingredients & Raw Materials</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rs</span>
                  <input 
                    type="number" min="0" max="999999999"
                    value={ingredientsCost || ''} onChange={e => setIngredientsCost(Number(e.target.value))}
                    className="w-full pl-9 rounded-md border border-input bg-background px-3 py-2.5 text-sm font-semibold outline-none focus:border-accent"
                    placeholder="0"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2 text-muted-foreground">Labor & Staff Salaries</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rs</span>
                  <input 
                    type="number" min="0" max="999999999"
                    value={laborCost || ''} onChange={e => setLaborCost(Number(e.target.value))}
                    className="w-full pl-9 rounded-md border border-input bg-background px-3 py-2.5 text-sm font-semibold outline-none focus:border-accent"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-muted-foreground">Rent & Utilities</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rs</span>
                  <input 
                    type="number" min="0" max="999999999"
                    value={rentAndUtilities || ''} onChange={e => setRentAndUtilities(Number(e.target.value))}
                    className="w-full pl-9 rounded-md border border-input bg-background px-3 py-2.5 text-sm font-semibold outline-none focus:border-accent"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-muted-foreground">Marketing & Ads</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rs</span>
                  <input 
                    type="number" min="0" max="999999999"
                    value={marketing || ''} onChange={e => setMarketing(Number(e.target.value))}
                    className="w-full pl-9 rounded-md border border-input bg-background px-3 py-2.5 text-sm font-semibold outline-none focus:border-accent"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold mb-2 text-muted-foreground">Other Expenses / Miscellaneous</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">Rs</span>
                  <input 
                    type="number" min="0" max="999999999"
                    value={otherExpenses || ''} onChange={e => setOtherExpenses(Number(e.target.value))}
                    className="w-full pl-9 rounded-md border border-input bg-background px-3 py-2.5 text-sm font-semibold outline-none focus:border-accent"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Results Display */}
          <section className="lg:col-span-5 space-y-6">
            
            {/* Total Revenue Card (Live from DB) */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <DollarSign className="w-24 h-24 text-accent" />
              </div>
              <h3 className="text-sm font-bold text-muted-foreground mb-1 uppercase tracking-wider">Gross Revenue (Live)</h3>
              <p className="text-4xl font-black text-foreground">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-accent mt-2 font-semibold">+ Pulled directly from Database</p>
            </div>

            {/* Total Expenses Card */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-muted-foreground mb-1 uppercase tracking-wider">Total Expenses</h3>
              <p className="text-3xl font-bold text-destructive">{formatCurrency(totalExpenses)}</p>
            </div>

            {/* Net Profit Card */}
            <div className={`border-2 rounded-xl p-6 shadow-sm ${isProfitable ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50'}`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-sm font-bold uppercase tracking-wider ${isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  Net Profit
                </h3>
                {isProfitable ? <TrendingUp className="w-6 h-6 text-green-500" /> : <TrendingDown className="w-6 h-6 text-red-500" />}
              </div>
              <p className={`text-5xl font-black tracking-tight ${isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {formatCurrency(netProfit)}
              </p>
              
              <div className="mt-4 flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${isProfitable ? 'bg-green-500/20 text-green-600 dark:text-green-400' : 'bg-red-500/20 text-red-600 dark:text-red-400'}`}>
                  {profitMargin}% Margin
                </span>
              </div>
            </div>

          </section>

        </div>
      </main>
    </div>
  )
}
