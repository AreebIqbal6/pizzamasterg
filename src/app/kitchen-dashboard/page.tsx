"use client"

import { useState, useEffect } from "react"
import { KitchenHeader } from "@/components/kitchen/kitchen-header"
import { OrderTable } from "@/components/kitchen/order-table"
import { OrderDetailDrawer } from "@/components/kitchen/order-detail-drawer"
import { KitchenOrder, OrderStatus } from "@/lib/kitchen-types"
import { createClient } from "@/lib/supabase/client"
import { updateOrderStatus } from "@/app/actions/order"
import { toggleSlammedMode, getBranchStatus } from "@/app/actions/branch"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { isAdminAuthUser, isKitchenAuthUser, normalizeEmail } from "@/lib/auth/access"
import { resolveKitchenBranch } from "@/lib/auth/branch"

function KitchenDashboardContent() {
  const searchParams = useSearchParams()
  const urlBranchId = searchParams.get('branchId')

  const [selectedBranch, setSelectedBranch] = useState("Loading...")
  const [branchId, setBranchId] = useState<string | null>(null)
  const [orders, setOrders] = useState<KitchenOrder[]>([])
  const [selectedOrder, setSelectedOrder] = useState<KitchenOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasUnacknowledgedOrder, setHasUnacknowledgedOrder] = useState(false)
  const [isSlammed, setIsSlammed] = useState(false)
  const [customEta, setCustomEta] = useState("30-45 mins")
  const [isTogglingSlammed, setIsTogglingSlammed] = useState(false)
  const [alertsActive, setAlertsActive] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    async function loadInitialData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) {
        window.location.href = '/kitchen-login'
        return
      }

      const email = normalizeEmail(user.email)
      const isAdmin = isAdminAuthUser(user)
      const isKitchen = isKitchenAuthUser(user)
      const userBranch = await resolveKitchenBranch(supabase, user)

      if (!isAdmin && !isKitchen && !userBranch) {
        window.location.href = '/'
        return
      }

      if (isAdmin && !email.includes('kitchen')) {
        // window.location.href = '/admin-dashboard' 
        // We'll allow admins to view the kitchen dashboard.
      }

      let targetBranchId = urlBranchId || userBranch?.id

      if (!targetBranchId) {
        if (isAdmin) {
          setSelectedBranch("All Branches (Admin View)")
          const { data: ordersData } = await supabase
            .from('orders')
            .select('*, branches(name)')
            .order('created_at', { ascending: false })
            
          if (ordersData) {
            const formattedOrders = ordersData.map(o => ({
              id: o.id,
              status: o.status,
              items: o.items,
              customerName: o.customer_name,
              customerPhone: o.customer_phone || 'N/A',
              deliveryAddress: o.customer_address || 'Pickup',
              delivery_lat: o.delivery_lat,
              delivery_lng: o.delivery_lng,
              delivery_instructions: o.delivery_instructions,
              subtotal: Number(o.subtotal ?? o.total ?? 0),
              discount: Number(o.discount ?? 0),
              total: o.total,
              time: new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              createdAt: new Date(o.created_at),
              branch: (o.branches as any)?.name || 'Unknown'
            }))
            setOrders(formattedOrders as KitchenOrder[])
          }
          setLoading(false)
          return
        }

        setSelectedBranch("Branch not assigned")
        setLoading(false)
        return
      }

      // Find which branch this kitchen email belongs to (or the overridden one)
      const { data: branch } = await supabase
        .from('branches')
        .select('id, name')
        .eq('id', targetBranchId)
        .single()
        
      if (branch) {
        setBranchId(branch.id)
        setSelectedBranch(branch.name)
        
        // Fetch slammed mode status
        const status = await getBranchStatus(branch.id)
        setIsSlammed(status.is_slammed)
        setCustomEta(status.custom_eta || "30-45 mins")
        
        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .eq('branch_id', branch.id)
          .order('created_at', { ascending: false })
          
        if (ordersData) {
          const formattedOrders = ordersData.map(o => ({
            id: o.id,
            status: o.status,
            items: o.items,
            customerName: o.customer_name,
            customerPhone: o.customer_phone || 'N/A',
            deliveryAddress: o.customer_address || 'Pickup',
            delivery_lat: o.delivery_lat,
            delivery_lng: o.delivery_lng,
            delivery_instructions: o.delivery_instructions,
            subtotal: Number(o.subtotal ?? o.total ?? 0),
            discount: Number(o.discount ?? 0),
            total: o.total,
            time: new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            createdAt: new Date(o.created_at),
            branch: branch.name
          }))
          setOrders(formattedOrders as KitchenOrder[])
        }
      } else {
        setSelectedBranch("Branch not found")
      }
      setLoading(false)
    }

    loadInitialData()
  }, [supabase, urlBranchId])

  useEffect(() => {
    if (!branchId && selectedBranch !== "All Branches (Admin View)" && selectedBranch !== "All Branches (Demo View)") return

    // Subscribe to realtime orders
    const channel = supabase
      .channel('public:orders')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new
            if (newOrder.branch_id === branchId || !branchId) {
              setOrders(prev => [{
                id: newOrder.id,
                status: newOrder.status,
                items: newOrder.items,
                customerName: newOrder.customer_name,
                customerPhone: newOrder.customer_phone || 'N/A',
                deliveryAddress: newOrder.customer_address || 'Pickup',
                delivery_lat: newOrder.delivery_lat,
                delivery_lng: newOrder.delivery_lng,
                delivery_instructions: newOrder.delivery_instructions,
                subtotal: Number(newOrder.subtotal ?? newOrder.total ?? 0),
                discount: Number(newOrder.discount ?? 0),
                total: newOrder.total,
                time: new Date(newOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                createdAt: new Date(newOrder.created_at),
                branch: selectedBranch
              } as KitchenOrder, ...prev])
              
              if (alertsActive) {
                const audio = new Audio('/alert.mp3') // Assume we have a generic alert sound or it can be a simple beep
                audio.play().catch(e => console.log('Audio play failed:', e))
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new
            setOrders(prev => prev.map(o => o.id === updated.id ? { ...o, status: updated.status } : o))
            if (selectedOrder?.id === updated.id) {
              setSelectedOrder(prev => prev ? { ...prev, status: updated.status } : null)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, branchId, selectedBranch, selectedOrder?.id])

  // Process Offline Queue
  useEffect(() => {
    const syncOfflineQueue = async () => {
      if (!navigator.onLine) return
      
      const queueRaw = localStorage.getItem("kitchen_offline_queue")
      if (!queueRaw) return
      
      try {
        const queue: any[] = JSON.parse(queueRaw)
        if (queue.length === 0) return
        
        toast.info(`Syncing ${queue.length} offline actions...`)
        
        for (const action of queue) {
          try {
            await updateOrderStatus(action.orderId, action.newStatus, action.riderName)
          } catch (e) {
            console.error("Failed to sync queued action:", e)
          }
        }
        
        localStorage.removeItem("kitchen_offline_queue")
        toast.success("Offline actions synced successfully!")
      } catch (e) {
        console.error("Error parsing offline queue", e)
      }
    }

    window.addEventListener('online', syncOfflineQueue)
    // Run once on mount in case we came back online
    syncOfflineQueue()

    return () => window.removeEventListener('online', syncOfflineQueue)
  }, [])

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus, riderName?: string, cancellationReason?: string) => {
    // Find the original status for rollback
    const originalStatus = orders.find(o => o.id === orderId)?.status || 'pending'

    // Optimistic UI update
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: newStatus } : order)))
    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus })
    }

    if (!navigator.onLine) {
      const queueRaw = localStorage.getItem("kitchen_offline_queue")
      const queue = queueRaw ? JSON.parse(queueRaw) : []
      queue.push({ orderId, newStatus, riderName, timestamp: Date.now() })
      localStorage.setItem("kitchen_offline_queue", JSON.stringify(queue))
      toast.success("Offline: Action queued")
      return
    }

    // Update using Server Action to bypass missing RLS UPDATE policy
    try {
      await updateOrderStatus(orderId, newStatus, riderName, cancellationReason)
      toast.success(`Order ${orderId.slice(0, 8)} status updated to ${newStatus}`)
    } catch (e) {
      console.error("Failed to update order:", e)
      toast.error("Failed to update order")
      // Revert optimistic update on failure
      setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: originalStatus as OrderStatus } : order)))
    }
  }

  // Calculate Analytics
  const completedOrders = orders.filter(o => o.status === 'completed')
  const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.total), 0)
  
  // Last 7 days revenue
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().split('T')[0]
  }).reverse()

  const dailyData = last7Days.map(date => {
    const dayOrders = completedOrders.filter(o => {
      const d = new Date(o.createdAt)
      return d.toISOString().split('T')[0] === date
    })
    return {
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      revenue: dayOrders.reduce((sum, o) => sum + Number(o.total), 0),
      orders: dayOrders.length
    }
  })

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading Kitchen Dashboard...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <KitchenHeader selectedBranch={selectedBranch} />

      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Branch Controls */}
        {branchId && (
          <div className="mb-6 flex justify-end gap-3">
            <button
              onClick={() => {
                setAlertsActive(!alertsActive)
                if (!alertsActive) {
                  // Play a silent or quick beep to unlock audio context on mobile/browsers
                  const audio = new Audio('/alert.mp3')
                  audio.play().catch(() => {})
                  toast.success("Audio alerts activated for new orders")
                } else {
                  toast.success("Audio alerts disabled")
                }
              }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold shadow transition ${alertsActive ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}
            >
              🔊 {alertsActive ? "Alerts Active" : "Activate Alerts"}
            </button>
            <button 
              onClick={async () => {
                const newSlammed = !isSlammed
                const newEta = newSlammed ? prompt("Enter custom ETA for Rush Hour (e.g. 60-90 mins):", "60-90 mins") || "60-90 mins" : "30-45 mins"
                
                setIsTogglingSlammed(true)
                try {
                  await toggleSlammedMode(branchId, newSlammed, newEta)
                  setIsSlammed(newSlammed)
                  setCustomEta(newEta)
                  toast.success(`Rush Hour mode ${newSlammed ? 'enabled' : 'disabled'}`)
                } catch (e) {
                  toast.error("Failed to toggle Rush Hour mode")
                } finally {
                  setIsTogglingSlammed(false)
                }
              }}
              disabled={isTogglingSlammed}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-white shadow transition disabled:opacity-50 ${isSlammed ? 'bg-red-600 hover:bg-red-700 animate-pulse' : 'bg-secondary text-muted-foreground hover:bg-secondary/80'}`}
            >
              🚨 {isSlammed ? `Rush Hour Active (ETA: ${customEta})` : 'Enable Rush Hour'}
            </button>
          </div>
        )}

        {/* Stats Section */}
        <div className="mb-8 grid grid-cols-4 gap-4">
          <div className="rounded-lg border border-border bg-card p-4 hover:bg-secondary/50 transition">
            <p className="text-xs font-semibold text-muted-foreground">PENDING</p>
            <p className="mt-2 text-3xl font-bold text-yellow-400">
              {orders.filter((o) => o.status === "pending").length}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 hover:bg-secondary/50 transition">
            <p className="text-xs font-semibold text-muted-foreground">PREPARING</p>
            <p className="mt-2 text-3xl font-bold text-orange-400">
              {orders.filter((o) => o.status === "preparing").length}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 hover:bg-secondary/50 transition">
            <p className="text-xs font-semibold text-muted-foreground">ON THE WAY</p>
            <p className="mt-2 text-3xl font-bold text-blue-400">
              {orders.filter((o) => o.status === "on-the-way").length}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 hover:bg-secondary/50 transition">
            <p className="text-xs font-semibold text-muted-foreground">COMPLETED</p>
            <p className="mt-2 text-3xl font-bold text-green-400">
              {completedOrders.length}
            </p>
          </div>
        </div>

        {/* Analytics Section */}
        <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-bold text-accent mb-6">Branch Analytics</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div className="rounded-lg bg-secondary/50 p-5">
                <p className="text-sm font-semibold text-muted-foreground">Total Branch Revenue</p>
                <p className="mt-1 text-3xl font-extrabold text-foreground">Rs. {totalRevenue.toLocaleString()}</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-5">
                <p className="text-sm font-semibold text-muted-foreground">Total Lifetime Orders</p>
                <p className="mt-1 text-3xl font-extrabold text-foreground">{completedOrders.length}</p>
              </div>
            </div>
            
            <div className="lg:col-span-2 h-[200px]">
              <p className="text-sm font-bold text-muted-foreground mb-4">Daily Revenue (Last 7 Days)</p>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="date" stroke="#888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rs.${value}`} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ backgroundColor: '#111', borderColor: '#333', borderRadius: '8px' }}
                  />
                  <Bar dataKey="revenue" fill="#ff4500" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-accent">Live Orders</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {orders.length} order{orders.length !== 1 ? "s" : ""}
          </p>
        </div>

        {orders.length > 0 ? (
          <OrderTable orders={orders} onOrderClick={setSelectedOrder} />
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/50 p-16 text-center">
            <div className="mb-4 rounded-full bg-secondary p-4 text-muted-foreground">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
            </div>
            <h3 className="text-xl font-bold text-accent">No active orders</h3>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              All caught up! There are no pending or preparing orders for this branch right now.
            </p>
          </div>
        )}
      </main>

      {/* Powered by Skillora Footer */}
      <footer className="mt-auto border-t border-border bg-card py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026 Pizza Master G. All rights reserved. <br className="sm:hidden" />
          Powered by{" "}
          <a href="https://skilloraofficial.com/" target="_blank" rel="noopener noreferrer" className="font-bold text-accent hover:underline">
            Skillora
          </a>
        </div>
      </footer>

      {/* Detail Drawer */}
      <OrderDetailDrawer 
        order={selectedOrder}
        branchId={branchId}
        onClose={() => setSelectedOrder(null)}
        onStatusChange={handleStatusChange}
      />
    </div>
  )
}

export default function KitchenDashboardPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen bg-background items-center justify-center">Loading...</div>}>
      <KitchenDashboardContent />
    </Suspense>
  )
}
