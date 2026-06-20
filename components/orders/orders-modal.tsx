"use client"

import { useState, useEffect } from "react"
import { X, Clock, CheckCircle, ChevronRight, Package, Bike, Ban, RefreshCw, Phone } from "lucide-react"
import { useStore, formatPrice } from "@/components/cart/cart-context"
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import dynamic from "next/dynamic"

const ReviewModal = dynamic(() => import("@/components/review-modal"), { ssr: false })
import { OrderSuccess } from "@/components/checkout/order-success"

type OrderItem = {
  id: string
  name: string
  price: number
  qty: number
  options?: any
}

type Order = {
  id: string
  created_at: string
  total: number
  status: 'pending' | 'preparing' | 'on-the-way' | 'completed' | 'cancelled'
  items: OrderItem[]
  customer_address: string
}

const statusMap: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: "Pending", icon: Clock, color: "text-yellow-600 bg-yellow-500/10" },
  preparing: { label: "Preparing", icon: Package, color: "text-orange-600 bg-orange-500/10" },
  "quality-check": { label: "Prepared", icon: CheckCircle, color: "text-indigo-600 bg-indigo-500/10" },
  "on-the-way": { label: "On the way", icon: Bike, color: "text-blue-600 bg-blue-500/10" },
  completed: { label: "Delivered", icon: CheckCircle, color: "text-green-600 bg-green-500/10" },
  cancelled: { label: "Cancelled", icon: Ban, color: "text-red-600 bg-red-500/10" },
}

export function OrdersModal() {
  const { overlay, closeOverlay, user, addItem, clearCart, openOverlay } = useStore()
  const open = overlay === "orders"
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (open && user?.id) {
      fetchOrders()

      const channel = supabase
        .channel(`public:orders:${user.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
          () => {
            fetchOrders()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [open, user?.id])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
      
      if (!error && data) {
        setOrders(data as Order[])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleReorder = async (pastItems: OrderItem[]) => {
    toast.loading("Validating menu items...")
    try {
      const ids = pastItems.map(i => i.id)
      const { data: currentMenuItems, error } = await supabase
        .from('menu_items')
        .select('id, name, price, category, available')
        .in('id', ids)

      if (error) throw error

      let addedCount = 0
      let missingItems: string[] = []

      // Clear current cart for a clean reorder
      clearCart()

      for (const pastItem of pastItems) {
        const currentItem = currentMenuItems?.find(m => m.id === pastItem.id)
        if (currentItem && currentItem.available) {
          // Re-add to cart with CURRENT price
          addItem({
            id: currentItem.id,
            name: currentItem.name,
            price: currentItem.price,
            image: ''
          })
          addedCount++
        } else {
          missingItems.push(pastItem.name)
        }
      }

      toast.dismiss()

      if (missingItems.length > 0) {
        toast.warning(
          `${addedCount} of ${pastItems.length} items added. ${missingItems.join(', ')} is currently unavailable.`
        )
      } else {
        toast.success("Order added to cart!")
      }
      
      // Open the cart drawer
      openOverlay("cart")

    } catch (e: any) {
      toast.dismiss()
      toast.error("Failed to reorder: " + e.message)
    }
  }

  if (!open) return null

  const currentOrders = orders.filter(o => ['pending', 'preparing', 'on-the-way'].includes(o.status))
  const pastOrders = orders.filter(o => ['completed', 'cancelled'].includes(o.status))

  const handleCancelOrder = async (orderId: string) => {
    if (!user?.id) return
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', orderId)
      
      if (!error) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o))
      } else {
        console.error("Failed to cancel order:", error)
        toast.error("Failed to cancel order: " + error.message)
      }
    } catch (e: any) {
      console.error(e)
      toast.error("Error: " + e.message)
    }
  }

  const OrderCard = ({ order }: { order: Order }) => {
    const [expanded, setExpanded] = useState(false)
    const status = statusMap[order.status] || statusMap.pending
    const StatusIcon = status.icon
    const [timeLeft, setTimeLeft] = useState(0)

    useEffect(() => {
      const calcTime = () => {
        const diff = Math.floor((Date.now() - new Date(order.created_at).getTime()) / 1000)
        return Math.max(0, 120 - diff)
      }
      setTimeLeft(calcTime())
      const interval = setInterval(() => {
        setTimeLeft(calcTime())
      }, 1000)
      return () => clearInterval(interval)
    }, [order.created_at])

    const formatTimer = (seconds: number) => {
      const m = Math.floor(seconds / 60)
      const s = seconds % 60
      return `${m}:${s.toString().padStart(2, "0")}`
    }

    const isCurrent = ['pending', 'preparing', 'quality-check', 'on-the-way'].includes(order.status)
    const canCancel = order.status === 'pending' && timeLeft > 0

    return (
      <div className="rounded-xl border border-border bg-background shadow-sm transition hover:shadow-md overflow-hidden">
        <div 
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/5 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono">#{order.id.slice(0, 8)}</span>
              <span>•</span>
              <span>{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <div className="font-semibold text-sm">
              {order.items.length} item{order.items.length > 1 ? 's' : ''} • {formatPrice(order.total)}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isCurrent && order.status === 'pending' && timeLeft > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-md animate-pulse">
                <Clock className="h-3 w-3" />
                {formatTimer(timeLeft)}
              </div>
            )}
            <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${status.color}`}>
              <StatusIcon className="h-3.5 w-3.5" />
              {status.label}
            </div>
            <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`} />
          </div>
        </div>

        {expanded && (
          <div className="border-t border-border bg-secondary/20 p-4 space-y-4">
            {isCurrent && (
              <div className="py-2 border-b border-border">
                <OrderSuccess orderId={order.id} isModalView={true} />
              </div>
            )}

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Order Items</h4>
              {order.items?.map((item, i) => (
                <div key={i} className="flex justify-between text-sm py-1">
                  <span className="font-semibold">{item.qty}x {item.name}</span>
                  <span className="text-muted-foreground">{formatPrice(item.price * item.qty)}</span>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-xs text-muted-foreground truncate max-w-[60%]">
                {(order.customer_address || '').split('[RIDER:')[0].trim()}
              </span>
              <span className="font-bold text-accent">{formatPrice(order.total)}</span>
            </div>

            {(order.customer_address || '').includes('[RIDER:') && (
              <div className="border border-blue-500/20 bg-blue-500/10 rounded-lg p-3 mt-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/20 p-2 rounded-full">
                    <Bike className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-500 uppercase">Assigned Rider</p>
                    <p className="text-sm font-semibold text-foreground capitalize">
                      {order.customer_address.split('[RIDER:')[1].replace(']', '').split('|')[0]}
                    </p>
                  </div>
                </div>
                {order.customer_address.includes('|') && (
                  <a href={`tel:${order.customer_address.split('[RIDER:')[1].replace(']', '').split('|')[1]}`} className="bg-blue-500/20 p-2 rounded-full hover:bg-blue-500/30 transition">
                    <Phone className="h-5 w-5 text-blue-500" />
                  </a>
                )}
              </div>
            )}

            {isCurrent && (
              <div className="pt-3 border-t border-border flex justify-end">
                <button
                  onClick={(e) => { e.stopPropagation(); if (canCancel) handleCancelOrder(order.id); }}
                  disabled={!canCancel}
                  className={`px-4 py-2 text-sm font-bold rounded-md transition flex items-center gap-2 ${
                    canCancel 
                      ? "bg-red-500 text-white hover:bg-red-600" 
                      : "bg-secondary text-muted-foreground cursor-not-allowed opacity-50"
                  }`}
                >
                  Cancel Order
                </button>
              </div>
            )}
            
            {/* PAST ORDERS: Review & Reorder */}
            {!isCurrent && (
              <div className="pt-3 border-t border-border flex justify-end gap-2">
                {order.status === 'completed' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setReviewOrderId(order.id); }}
                    className="px-4 py-2 text-sm font-bold rounded-md transition bg-secondary text-foreground hover:opacity-90 flex items-center justify-center"
                  >
                    Leave a Review
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); handleReorder(order.items); }}
                  className="px-4 py-2 text-sm font-bold rounded-md transition bg-accent text-accent-foreground hover:opacity-90 hover:bg-accent/80 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <RefreshCw className="h-4 w-4" /> Reorder
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className={`fixed inset-0 z-[60] flex justify-end transition-opacity ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div onClick={closeOverlay} className="absolute inset-0 bg-black/60" />
        <div className={`relative z-10 flex h-full w-full max-w-md flex-col bg-card shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-heading text-lg font-bold text-accent">My Orders</h2>
            <button onClick={closeOverlay} aria-label="Close" className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            {loading && orders.length === 0 ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-accent" />
              </div>
            ) : orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                <Package className="h-12 w-12 mb-4 opacity-20" />
                <p className="font-semibold text-foreground">No orders yet</p>
                <p className="text-sm">When you place an order, it will appear here.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {currentOrders.length > 0 && (
                  <div>
                    <h3 className="mb-3 font-heading font-bold text-lg">Current Orders</h3>
                    <div className="space-y-3">
                      {currentOrders.map(order => <OrderCard key={order.id} order={order} />)}
                    </div>
                  </div>
                )}
                
                {pastOrders.length > 0 && (
                  <div>
                    <h3 className="mb-3 font-heading font-bold text-lg">Past Orders</h3>
                    <div className="space-y-3">
                      {pastOrders.map(order => <OrderCard key={order.id} order={order} />)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <ReviewModal isOpen={!!reviewOrderId} orderId={reviewOrderId} onClose={() => setReviewOrderId(null)} />
    </>
  )
}
