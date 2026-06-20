'use client'

import { useEffect, useState } from 'react'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { KPICards } from '@/components/admin/kpi-cards'
import { RevenueChart } from '@/components/admin/revenue-chart'
import { TransactionsTable } from '@/components/admin/transactions-table'
import { BranchLeaderboard } from '@/components/admin/branch-leaderboard'
import { createClient } from '@/lib/supabase/client'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({ totalRevenue: 0, totalOrders: 0, activeOrders: 0, completedOrders: 0, avgDeliveryTime: 0 })
  const [revenueData, setRevenueData] = useState<any[]>([])
  const [leaderboardData, setLeaderboardData] = useState<any[]>([])
  const [transactions, setTransactions] = useState<any[]>([])
  const [rawOrders, setRawOrders] = useState<any[]>([])
  const [selectedBranch, setSelectedBranch] = useState("All")
  const [branchMap, setBranchMap] = useState<Record<string, {name: string, is_slammed: boolean}>>({})
  const [ridersMap, setRidersMap] = useState<Record<string, number>>({})

  const supabase = createClient()

  useEffect(() => {
    async function loadData() {
      // Fetch Branches
      const { data: branches } = await supabase.from('branches').select('id, name, is_slammed')
      const bMap: Record<string, {name: string, is_slammed: boolean}> = {}
      if (branches) {
        branches.forEach(b => {
          bMap[b.id] = { name: b.name, is_slammed: b.is_slammed }
        })
        setBranchMap(bMap)
      }

      // Fetch Active Riders
      const { data: riders } = await supabase.from('riders').select('branch_id').eq('is_active', true)
      const rMap: Record<string, number> = {}
      if (riders) {
        riders.forEach(r => {
          const bName = bMap[r.branch_id]?.name
          if (bName) {
            rMap[bName] = (rMap[bName] || 0) + 1
          }
        })
        setRidersMap(rMap)
      }

      // Fetch Orders
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          *,
          branches ( name )
        `)
        .order('created_at', { ascending: false })

      if (orders) {
        setRawOrders(orders)
      }
      setLoading(false)
    }
    
    loadData()
  }, [supabase])

  useEffect(() => {
    // Only bind real-time after branches map is loaded (so we can attach the branch name eagerly)
    if (Object.keys(branchMap).length === 0) return

    const channel = supabase
      .channel('public:orders:admin')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const bName = branchMap[payload.new.branch_id]?.name || 'Unknown'
            const newOrder = { ...payload.new, branches: { name: bName } }
            setRawOrders(prev => [newOrder, ...prev])
          } else if (payload.eventType === 'UPDATE') {
            // Update order, preserving its branch name if not sent in payload
            setRawOrders(prev => prev.map(o => o.id === payload.new.id ? { ...o, ...payload.new } : o))
          } else if (payload.eventType === 'DELETE') {
            setRawOrders(prev => prev.filter(o => o.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, branchMap])

  useEffect(() => {
    if (!rawOrders.length) return

    const orders = selectedBranch === "All" 
      ? rawOrders 
      : rawOrders.filter(o => ((o.branches as any)?.name || 'Unknown') === selectedBranch)

    // Calculate TAT (Turnaround Time in minutes)
    let totalTatMins = 0
    let tatCount = 0
    orders.forEach(o => {
      if (o.status === 'completed' && o.delivered_at && o.created_at) {
        const start = new Date(o.created_at).getTime()
        const end = new Date(o.delivered_at).getTime()
        totalTatMins += (end - start) / (1000 * 60)
        tatCount++
      }
    })
    const avgDeliveryTime = tatCount > 0 ? Math.round(totalTatMins / tatCount) : 0

    // Calculate KPIs
    const totalRevenue = orders.filter(o => o.status === 'completed').reduce((sum, o) => sum + Number(o.total), 0)
    const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length
    const completedOrders = orders.filter(o => o.status === 'completed').length
    const totalOrders = orders.length
    
    setMetrics({
      totalRevenue: totalRevenue,
      totalOrders: totalOrders,
      activeOrders: activeOrders,
      completedOrders: completedOrders,
      avgDeliveryTime: avgDeliveryTime,
    } as any)

    // Group by Branch for Leaderboard
    const branchStats: Record<string, { revenue: number, orders: number, totalTat: number, tatCount: number, isSlammed: boolean }> = {}
    
    // Initialize with all known branches
    Object.values(branchMap).forEach(b => {
      branchStats[b.name] = { revenue: 0, orders: 0, totalTat: 0, tatCount: 0, isSlammed: b.is_slammed }
    })

    rawOrders.forEach(o => {
      const bName = (o.branches as any)?.name || 'Unknown'
      if (!branchStats[bName]) {
        branchStats[bName] = { revenue: 0, orders: 0, totalTat: 0, tatCount: 0, isSlammed: false }
      }
      
      if (o.status !== 'cancelled') {
        branchStats[bName].revenue += Number(o.total)
        branchStats[bName].orders++
      }
      
      if (o.status === 'completed') {
        if (o.delivered_at && o.created_at) {
          const start = new Date(o.created_at).getTime()
          const end = new Date(o.delivered_at).getTime()
          branchStats[bName].totalTat += (end - start) / (1000 * 60)
          branchStats[bName].tatCount++
        }
      }
    })
    
    const chartData = Object.keys(branchStats).map(name => ({
      name,
      revenue: branchStats[name].revenue
    }))
    setRevenueData(chartData)

    const lBoardData = Object.keys(branchStats).map(name => ({
      name,
      revenue: branchStats[name].revenue,
      orders: branchStats[name].orders,
      avgTat: branchStats[name].tatCount > 0 ? Math.round(branchStats[name].totalTat / branchStats[name].tatCount) : 0,
      activeRiders: ridersMap[name] || 0,
      isSlammed: branchStats[name].isSlammed
    })).sort((a, b) => b.revenue - a.revenue)
    
    setLeaderboardData(lBoardData)

    // Format Transactions
    const formattedTx = orders.map(o => ({
      id: o.id,
      orderId: o.id.split('-')[0], // just take first chunk of uuid for display
      customer: o.customer_name,
      branch: (o.branches as any)?.name || 'Unknown',
      totalAmount: Number(o.total),
      paymentMethod: 'Cash on Delivery',
      status: o.status === 'quality-check' 
                ? 'Prepared' 
                : o.status.split('-').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
      timestamp: new Date(o.created_at)
    }))
    setTransactions(formattedTx)
  }, [rawOrders, selectedBranch, branchMap, ridersMap]) // Added dependencies

  if (loading) {
    return <div className="flex min-h-screen bg-background items-center justify-center">Loading Admin Dashboard...</div>
  }

  const uniqueBranches = Object.values(branchMap).map(b => b.name).sort()

  return (
    <>
        {/* Header */}
        <div className="bg-card border-b border-border sticky top-0 z-10">
          <div className="px-8 py-6 flex justify-between items-center">
            <div>
              <h1 className="font-heading text-3xl font-bold text-accent">Dashboard Overview</h1>
              <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening with Pizza Master G today.</p>
            </div>
            
            {/* Branch Dropdown & Live Kitchen Link */}
            <div className="flex items-center gap-4">
              <label className="text-sm font-semibold text-muted-foreground">Branch:</label>
              <select
                data-testid="branch-filter"
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="All">All Branches</option>
                {uniqueBranches.map(branch => (
                  <option key={branch as string} value={branch as string}>{branch as string}</option>
                ))}
              </select>

              {selectedBranch !== "All" && (
                <a 
                  href={`/kitchen-dashboard?branchId=${Object.keys(branchMap).find(k => branchMap[k].name === selectedBranch)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-bold text-accent-foreground transition hover:opacity-90 shadow-[0_0_15px_rgba(255,190,0,0.3)]"
                >
                  View Live Kitchen
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* KPI Cards */}
          <KPICards metrics={metrics as any} />

          {/* God's Eye Leaderboard */}
          {selectedBranch === "All" && (
            <BranchLeaderboard data={leaderboardData} />
          )}

          {/* Revenue Chart */}
          <RevenueChart data={revenueData} />

          {/* Transactions Table */}
          <TransactionsTable transactions={transactions} />

          {/* Powered by Skillora Footer */}
          <footer className="mt-8 border-t border-border bg-card py-6 rounded-xl shadow-sm">
            <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
              © 2026 Pizza Master G. All rights reserved. <br className="sm:hidden" />
              Powered by{" "}
              <a href="https://skilloraofficial.com/" target="_blank" rel="noopener noreferrer" className="font-bold text-accent hover:underline">
                Skillora
              </a>
            </div>
          </footer>
        </div>
    </>
  )
}
