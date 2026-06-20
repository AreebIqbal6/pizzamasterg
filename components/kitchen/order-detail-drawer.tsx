"use client"

import { useEffect, useState } from "react"
import { X, MapPin, Percent, DollarSign, Printer, Loader2, Phone, MessageCircle, Copy, AlertCircle } from "lucide-react"
import { KitchenOrder, OrderStatus } from "@/lib/kitchen-types"
import { getActiveRidersByBranch } from "@/app/actions/riders"
import MiniMap from "./mini-map"

type Props = {
  order: KitchenOrder | null
  branchId: string | null
  onClose: () => void
  onStatusChange: (orderId: string, newStatus: OrderStatus, riderName?: string) => void
}

export function OrderDetailDrawer({ order, branchId, onClose, onStatusChange }: Props) {
  const [isLoading, setIsLoading] = useState(false)
  const [assignedRider, setAssignedRider] = useState("unassigned")
  const [activeRiders, setActiveRiders] = useState<{ id: string; name: string }[]>([])
  const [isLoadingRiders, setIsLoadingRiders] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    if (order && branchId) {
      const fetchRiders = async () => {
        setIsLoadingRiders(true)
        const riders = await getActiveRidersByBranch(branchId)
        setActiveRiders(riders)
        setIsLoadingRiders(false)
      }
      fetchRiders()
    }
  }, [order, branchId])

  if (!order) return null

  const handleStatusChange = async (newStatus: OrderStatus, reason?: string) => {
    // Delivery orders require a rider before dispatching/completing
    const isDelivery = order.deliveryAddress && order.deliveryAddress.toLowerCase() !== 'pickup'
    if (isDelivery && (newStatus === 'on-the-way' || newStatus === 'completed') && assignedRider === 'unassigned') {
      alert("Please assign a rider before dispatching or delivering this order.")
      return
    }

    if (newStatus === 'cancelled') {
      setIsCancelling(true)
    } else {
      setIsLoading(true)
    }

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    
    let riderPayload = undefined
    if (assignedRider !== "unassigned") {
      const riderInfo = activeRiders.find(r => r.name === assignedRider)
      riderPayload = riderInfo ? `${riderInfo.name}|${riderInfo.phone}` : assignedRider
    }
    
    onStatusChange(order.id, newStatus, riderPayload, reason)
    
    if (newStatus === 'cancelled') {
      setIsCancelling(false)
      setShowCancelModal(false)
      setCancelReason("")
      onClose()
    } else {
      setIsLoading(false)
    }
  }

  const canAccept = order.status === "pending"
  const canPrepare = order.status === "preparing"
  const canDispatch = order.status === "quality-check"
  const canDeliver = order.status === "on-the-way"

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 bg-black/50 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto bg-card shadow-2xl animate-in slide-in-from-right">
        {/* Header */}
        <div className="border-b border-border bg-secondary px-6 py-4 flex items-center justify-between sticky top-0">
          <div>
            <h2 className="text-lg font-bold text-accent">{order.id}</h2>
            <p className="text-xs text-muted-foreground">{order.customerName}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="rounded-lg p-2 text-muted-foreground transition hover:bg-background hover:text-accent"
              title="Print Receipt"
            >
              <Printer className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-muted-foreground transition hover:bg-accent/10 hover:text-foreground"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status & Time */}
          <div className="flex items-center justify-between rounded-lg bg-accent/10 px-4 py-3">
            <div>
              <p className="text-xs font-bold text-accent uppercase mb-0.5">CURRENT STATUS</p>
              <p className="text-sm font-semibold text-foreground uppercase">
                {order.status === 'quality-check' ? 'PREPARED' : order.status.replace('-', ' ')}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-muted-foreground uppercase mb-0.5">ORDER TIME</p>
              <p className="text-sm font-semibold text-foreground">{order.time}</p>
            </div>
          </div>

          {/* Customer Info */}
          <div>
            <h3 className="mb-3 text-sm font-bold text-accent">CUSTOMER DETAILS</h3>
            <div className="rounded-lg bg-secondary p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-accent/20 p-2">
                  <Phone className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone Number</p>
                  <p className="text-sm font-semibold text-foreground">{order.customerPhone}</p>
                </div>
                <a href={`tel:${order.customerPhone}`} className="ml-auto rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground hover:opacity-90 transition">
                  Call
                </a>
                <a href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="rounded-full bg-green-500 px-3 py-1 text-xs font-bold text-white hover:opacity-90 transition flex items-center gap-1">
                  <MessageCircle className="h-3 w-3" /> WA
                </a>
              </div>
            </div>
          </div>

          {/* Delivery Info */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-accent flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                DELIVERY INFO
              </h3>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(order.deliveryAddress)
                }}
                className="text-xs flex items-center gap-1 text-muted-foreground hover:text-accent transition"
              >
                <Copy className="h-3 w-3" /> Copy
              </button>
            </div>
            
            <div className="rounded-lg bg-secondary p-3 space-y-3">
              <p className="text-sm text-foreground">{order.deliveryAddress}</p>
              
              {order.delivery_lat && order.delivery_lng && (
                <div className="relative h-32 w-full overflow-hidden rounded-md border border-border">
                  <MiniMap lat={order.delivery_lat} lng={order.delivery_lng} />
                </div>
              )}

              {order.delivery_instructions && (
                <div className="rounded border border-yellow-500/30 bg-yellow-500/10 p-2 flex gap-2 items-start text-yellow-600">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p className="text-xs font-medium leading-relaxed">{order.delivery_instructions}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="mb-3 text-sm font-bold text-accent">ORDER ITEMS</h3>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg bg-secondary p-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-accent">Rs. {Number(item.price || 0) * Number(item.quantity || 1)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Price Breakdown */}
          <div>
            <h3 className="mb-3 text-sm font-bold text-accent flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              PRICING
            </h3>
            <div className="rounded-lg bg-secondary p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Subtotal</p>
                <p className="text-sm font-semibold text-foreground">Rs. {order.subtotal}</p>
              </div>
              {order.discount > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Discount {order.discountReason && `(${order.discountReason})`}
                    </p>
                    <p className="text-sm font-semibold text-red-400">-Rs. {order.discount}</p>
                  </div>
                  <div className="border-t border-border pt-3" />
                </>
              )}
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-accent">TOTAL</p>
                <p className="text-lg font-bold text-accent">Rs. {order.total}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Rider Assignment */}
        <div className="border-t border-border bg-secondary px-6 py-4">
          <label htmlFor="rider-select" className="block text-xs font-bold text-accent mb-2">
            ASSIGN RIDER
          </label>
          <div className="w-full">
            <select
              value={assignedRider}
              onChange={(e) => setAssignedRider(e.target.value)}
              disabled={isLoadingRiders}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground focus:border-accent focus:outline-none disabled:opacity-50"
            >
              <option value="unassigned">-- Select Rider --</option>
              {activeRiders.map(rider => {
                const load = rider.current_load || 0
                const max = rider.max_load || 3
                const isOverloaded = load >= max
                const loadText = load === 0 ? "Available" : `${load} active deliver${load > 1 ? 'ies' : 'y'}`
                return (
                  <option key={rider.id} value={rider.name} className="capitalize" disabled={isOverloaded}>
                    {rider.name} — {isOverloaded ? 'OVERLOADED' : loadText}
                  </option>
                )
              })}
            </select>
            {isLoadingRiders && <p className="text-xs text-muted-foreground mt-1 animate-pulse">Loading active riders...</p>}
          </div>
          {assignedRider !== "unassigned" && (
            <p className="mt-2 text-xs text-accent font-semibold">
              Assigned to: <span className="capitalize">{assignedRider}</span>
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 border-t border-border bg-secondary px-6 py-4 space-y-3">
          <button
            onClick={() => handleStatusChange("preparing")}
            disabled={!canAccept || isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent px-4 py-3 text-sm font-bold text-accent-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading && canAccept ? <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : null}
            {isLoading && canAccept ? "Processing..." : "Accept Order"}
          </button>

          <button
            onClick={() => handleStatusChange("quality-check")}
            disabled={!canPrepare || isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-3 text-sm font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading && canPrepare ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isLoading && canPrepare ? "Processing..." : "Prepare"}
          </button>

          <button
            onClick={() => handleStatusChange("on-the-way")}
            disabled={!canDispatch || isLoading || (order.deliveryAddress?.toLowerCase() !== 'pickup' && assignedRider === "unassigned")}
            className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-blue-500 px-4 py-3 text-sm font-bold text-blue-400 transition hover:bg-blue-900/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading && canDispatch ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isLoading && canDispatch ? "Processing..." : "Dispatch"}
          </button>

          <button
            onClick={() => handleStatusChange("completed")}
            disabled={!canDeliver || isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-green-500 px-4 py-3 text-sm font-bold text-green-400 transition hover:bg-green-900/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading && canDeliver ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isLoading && canDeliver ? "Processing..." : "Mark Delivered"}
          </button>
          
          <button
            onClick={() => setShowCancelModal(true)}
            disabled={order.status === 'cancelled' || order.status === 'completed' || isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-lg border-2 border-red-500/50 px-4 py-3 text-sm font-bold text-red-400 transition hover:bg-red-900/20 disabled:hidden"
          >
            Cancel Order
          </button>
        </div>

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="absolute inset-0 z-50 flex flex-col justify-end bg-black/80 px-4 pb-6">
            <div className="rounded-xl bg-card p-6 shadow-xl animate-in slide-in-from-bottom-10">
              <h3 className="text-lg font-bold text-red-500 mb-2">Cancel Order</h3>
              <p className="text-sm text-muted-foreground mb-4">Please select a reason for cancelling this order. This action cannot be undone.</p>
              
              <div className="space-y-2 mb-6">
                {['Out of Stock', 'Customer Requested', 'Fake Order', 'Rider Unavailable', 'Other'].map(reason => (
                  <label key={reason} className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-secondary">
                    <input 
                      type="radio" 
                      name="cancelReason" 
                      value={reason} 
                      checked={cancelReason === reason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="accent-red-500 w-4 h-4"
                    />
                    <span className="text-sm font-medium">{reason}</span>
                  </label>
                ))}
              </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowCancelModal(false)}
                  disabled={isCancelling}
                  className="flex-1 rounded-lg bg-secondary py-3 text-sm font-bold hover:bg-secondary/80 disabled:opacity-50"
                >
                  Go Back
                </button>
                <button 
                  onClick={() => handleStatusChange('cancelled', cancelReason)}
                  disabled={!cancelReason || isCancelling}
                  className="flex-1 rounded-lg bg-red-600 py-3 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCancelling && <Loader2 className="h-4 w-4 animate-spin" />}
                  Confirm Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Printable Receipt (Only visible during print) */}
        <div id="print-receipt" className="hidden print:block font-mono text-black bg-white mx-auto text-[13px] leading-tight p-4 w-[80mm]">
          <div className="text-center mb-4">
            <h1 className="text-xl font-bold uppercase">Pizza Master G</h1>
            <p className="text-xs mt-1">Mukka Chowk Branch</p>
            <p className="text-xs font-bold mt-2">ORDER: {order.id.split('-')[0].toUpperCase()}</p>
          </div>
          <div className="border-b border-dashed border-black mb-4 pb-2">
            <p><strong>Name:</strong> {order.customerName}</p>
            <p><strong>Phone:</strong> {order.customerPhone}</p>
            <p><strong>Address:</strong> {order.deliveryAddress}</p>
          </div>
          <table className="w-full text-left mb-4">
            <thead>
              <tr className="border-b border-dashed border-black">
                <th className="pb-1 font-semibold">Item</th>
                <th className="pb-1 font-semibold text-right w-8">Qty</th>
                <th className="pb-1 font-semibold text-right w-16">Amt</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-1 break-words pr-2">{item.name}</td>
                  <td className="py-1 text-right align-top">{item.quantity}</td>
                  <td className="py-1 text-right align-top">{Number(item.price || 0) * Number(item.quantity || 1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-dashed border-black pt-2 text-right">
            <p>Subtotal: Rs. {order.subtotal}</p>
            {order.discount > 0 && <p>Discount: -Rs. {order.discount}</p>}
            <p className="font-bold text-base mt-1">TOTAL: Rs. {order.total}</p>
          </div>
          <div className="text-center mt-6 border-t border-dashed border-black pt-4">
            <p className="text-xs">Thank you for choosing</p>
            <p className="font-bold">Pizza Master G!</p>
          </div>
        </div>
      </div>
    </>
  )
}
