"use client"

import { useMemo } from "react"
import { KitchenOrder, OrderStatus } from "@/lib/kitchen-types"
import { Clock } from "lucide-react"

type Props = {
  orders: KitchenOrder[]
  onOrderClick: (order: KitchenOrder) => void
}

const statusConfig: Record<OrderStatus, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-yellow-900/30", text: "text-yellow-300", label: "Pending" },
  preparing: { bg: "bg-orange-900/30", text: "text-orange-300", label: "Preparing" },
  baking: { bg: "bg-orange-800/30", text: "text-orange-400", label: "Baking" },
  "quality-check": { bg: "bg-indigo-900/30", text: "text-indigo-300", label: "Prepared" },
  "on-the-way": { bg: "bg-blue-900/30", text: "text-blue-300", label: "On the Way" },
  completed: { bg: "bg-green-900/30", text: "text-green-300", label: "Completed" },
  cancelled: { bg: "bg-red-900/30", text: "text-red-300", label: "Cancelled" },
}

function TimeElapsed({ createdAt }: { createdAt: Date }) {
  const elapsed = useMemo(() => {
    const now = new Date()
    const diffMs = now.getTime() - createdAt.getTime()
    const minutes = Math.floor(diffMs / 60000)
    const seconds = Math.floor((diffMs % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }, [createdAt])

  return (
    <div className="flex items-center gap-1 text-sm text-muted-foreground">
      <Clock className="h-4 w-4" />
      <span>{elapsed}</span>
    </div>
  )
}

export function OrderTable({ orders, onOrderClick }: Props) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-secondary">
            <th className="px-6 py-4 text-left text-sm font-semibold text-accent">Order ID</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-accent">Customer Info</th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-accent">Items Summary</th>
            <th className="px-6 py-4 text-center text-sm font-semibold text-accent">Time Elapsed</th>
            <th className="px-6 py-4 text-center text-sm font-semibold text-accent">Status</th>
            <th className="px-6 py-4 text-center text-sm font-semibold text-accent">Action</th>
          </tr>
        </thead>
        <tbody>
          {orders?.map((order) => {
            const config = statusConfig[order.status] || statusConfig.pending
            const itemsSummary = (order.items || []).map((item: any) => `${item.qty || item.quantity || 1}x ${item.name}`).join(", ")

            return (
              <tr
                key={order.id}
                className="border-b border-border transition hover:bg-secondary/50 cursor-pointer"
                onClick={() => onOrderClick(order)}
              >
                <td className="px-6 py-4 text-sm font-bold text-accent">{order.id}</td>
                <td className="px-6 py-4">
                  <div className="text-sm font-semibold text-foreground">{order.customerName}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground">{order.customerPhone}</span>
                    {order.customerPhone && order.customerPhone !== 'N/A' && (
                      <div className="flex items-center gap-1">
                        <a 
                          href={`tel:${order.customerPhone}`} 
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded-full bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition"
                          title="Call Customer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        </a>
                        <a 
                          href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(order.customerName)},%20this%20is%20Pizza%20Master%20G%20regarding%20your%20order.`} 
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1 rounded-full bg-green-900/30 text-green-400 hover:text-green-300 hover:bg-green-900/50 transition"
                          title="WhatsApp Customer"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
                        </a>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 max-w-xs">
                  <div className="line-clamp-2 text-sm text-foreground">{itemsSummary}</div>
                </td>
                <td className="px-6 py-4 text-center">
                  <TimeElapsed createdAt={order.createdAt} />
                </td>
                <td className="px-6 py-4 text-center">
                  <div className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${config.bg} ${config.text}`}>
                    {config.label}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onOrderClick(order)
                    }}
                    className="rounded-lg bg-accent px-4 py-2 text-xs font-bold text-accent-foreground transition hover:opacity-90"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
