import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft, Clock } from 'lucide-react'

// Revalidate every 60 seconds
export const revalidate = 60

export default async function TATAnalyticsPage() {
  const cookieStore = await cookies()
  // MVP: just fetch all completed orders with dispatch_time and delivery_time
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: orders } = await supabase
    .from('orders')
    .select('id, created_at, dispatch_time, delivery_time, status')
    .eq('status', 'completed')
    .not('dispatch_time', 'is', null)
    .not('delivery_time', 'is', null)
    .order('created_at', { ascending: false })
    .limit(50)

  let totalKitchenTime = 0
  let totalDeliveryTime = 0
  let validOrders = 0

  orders?.forEach(order => {
    const created = new Date(order.created_at).getTime()
    const dispatch = new Date(order.dispatch_time).getTime()
    const delivery = new Date(order.delivery_time).getTime()
    
    if (dispatch > created && delivery > dispatch) {
      totalKitchenTime += (dispatch - created)
      totalDeliveryTime += (delivery - dispatch)
      validOrders++
    }
  })

  const avgKitchenMins = validOrders ? Math.round(totalKitchenTime / validOrders / 60000) : 0
  const avgDeliveryMins = validOrders ? Math.round(totalDeliveryTime / validOrders / 60000) : 0
  const avgTotalMins = avgKitchenMins + avgDeliveryMins

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="border-b border-border bg-secondary/50 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-4">
          <Link href="/kitchen-dashboard" className="rounded-lg bg-secondary p-2 text-muted-foreground hover:bg-background hover:text-accent">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-accent flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Turnaround Time (TAT) Analytics
            </h1>
            <p className="text-xs text-muted-foreground">Average operational speeds across recent deliveries</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-sm font-semibold text-muted-foreground">Avg Kitchen Prep Time</p>
            <p className="mt-2 text-4xl font-bold text-accent">{avgKitchenMins} <span className="text-xl font-normal text-muted-foreground">mins</span></p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-sm font-semibold text-muted-foreground">Avg Delivery Time</p>
            <p className="mt-2 text-4xl font-bold text-orange-500">{avgDeliveryMins} <span className="text-xl font-normal text-muted-foreground">mins</span></p>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-sm font-semibold text-muted-foreground">Avg Total TAT</p>
            <p className="mt-2 text-4xl font-bold text-green-500">{avgTotalMins} <span className="text-xl font-normal text-muted-foreground">mins</span></p>
          </div>
        </div>
        
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="bg-secondary px-6 py-4 border-b border-border">
            <h3 className="font-bold text-sm">Recent Order Breakdown</h3>
          </div>
          <table className="w-full text-left text-sm">
            <thead className="bg-background">
              <tr>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Order ID</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Prep Time</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Delivery Time</th>
                <th className="px-6 py-3 font-semibold text-muted-foreground">Total TAT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {orders?.map(order => {
                const created = new Date(order.created_at).getTime()
                const dispatch = new Date(order.dispatch_time).getTime()
                const delivery = new Date(order.delivery_time).getTime()
                
                const prep = dispatch > created ? Math.round((dispatch - created) / 60000) : 0
                const del = delivery > dispatch ? Math.round((delivery - dispatch) / 60000) : 0
                
                return (
                  <tr key={order.id} className="hover:bg-secondary/20">
                    <td className="px-6 py-4 font-mono text-xs">{order.id.split('-')[0].toUpperCase()}</td>
                    <td className="px-6 py-4 text-accent">{prep} mins</td>
                    <td className="px-6 py-4 text-orange-400">{del} mins</td>
                    <td className="px-6 py-4 font-bold text-green-400">{prep + del} mins</td>
                  </tr>
                )
              })}
              {(!orders || orders.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">
                    No completed delivery orders with TAT data yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
