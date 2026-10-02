"use client"

import { useEffect, useState } from "react"
import { Check, MessageCircle, Package, Bike, Clock, CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

interface OrderSuccessProps {
  orderId: string
  customerPhone?: string
  onDone?: () => void
  isModalView?: boolean
}

export function OrderSuccess({ orderId, customerPhone, onDone, isModalView }: OrderSuccessProps) {
  const [status, setStatus] = useState<'pending' | 'preparing' | 'on-the-way' | 'completed' | 'cancelled'>('pending')
  const supabase = createClient()

  useEffect(() => {
    // Initial fetch to get current status in case it changed instantly
    const fetchStatus = async () => {
      const { data } = await supabase.from('orders').select('status').eq('id', orderId).single()
      if (data) {
        setStatus(data.status as any)
      }
    }
    fetchStatus()

    // Realtime subscription
    const subscription = supabase
      .channel(`public:orders:${orderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          setStatus(payload.new.status as any)
        }
      )
      .subscribe()

    // Proper cleanup to prevent memory leaks
    return () => {
      subscription.unsubscribe()
    }
  }, [orderId, supabase])

  // Format phone for WhatsApp (e.g. 03001234567 -> 923001234567)
  const formatWaPhone = (phone?: string) => {
    if (!phone) return "923000000000" // Fallback business number
    const clean = phone.replace(/\D/g, '')
    if (clean.startsWith('0')) return '92' + clean.substring(1)
    return clean
  }

  const waPhone = formatWaPhone(customerPhone)
  const waText = encodeURIComponent(`Hi! My order ID is #${orderId.slice(0,8)}. Can I get an update?`)
  const waUrl = `https://wa.me/${waPhone}?text=${waText}`

  const steps = [
    { key: 'pending', label: 'Received', icon: Clock },
    { key: 'preparing', label: 'Preparing', icon: Package },
    { key: 'on-the-way', label: 'Out for Delivery', icon: Bike },
    { key: 'completed', label: 'Delivered', icon: CheckCircle }
  ]

  const currentStepIndex = steps.findIndex(s => s.key === status)
  
  // Calculate progress percentage based on the 4 steps
  const progressPercent = currentStepIndex === -1 ? 0 : (currentStepIndex / (steps.length - 1)) * 100

  return (
    <div className="flex flex-col items-center gap-6 py-4 animate-in fade-in zoom-in duration-300 w-full">
      {!isModalView && (
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-500 ring-4 ring-green-500/20 mb-3">
            <Check className="h-8 w-8" />
          </div>
          <h3 className="font-heading text-2xl font-bold">Order Confirmed!</h3>
          <p className="text-sm text-muted-foreground mt-1 font-mono">
            Order #{orderId.slice(0, 8)}
          </p>
        </div>
      )}

      {/* Live Tracker */}
      <div className="w-full bg-secondary/30 rounded-xl p-5 border border-border">
        <h4 className="text-xs font-bold text-accent uppercase tracking-wider mb-6 flex items-center justify-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
          </span>
          Live Pizza Tracker
        </h4>

        <div className="relative pt-2 pb-6 px-4">
          {/* Track Background */}
          <div className="absolute top-6 left-6 right-6 h-1.5 bg-secondary rounded-full -z-10"></div>
          
          {/* Progress Fill */}
          <div 
            className="absolute top-6 left-6 h-1.5 bg-accent rounded-full -z-10 transition-all duration-700 ease-in-out" 
            style={{ width: `calc(${progressPercent}% - 0.5rem)` }}
          ></div>

          <div className="flex justify-between relative z-0">
            {steps.map((step, idx) => {
              const isActive = status === step.key
              const isPast = currentStepIndex >= idx
              const Icon = step.icon
              
              return (
                <div key={step.key} className="flex flex-col items-center gap-2">
                  <div className={`h-10 w-10 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                    isActive 
                      ? 'border-accent bg-accent text-accent-foreground shadow-[0_0_15px_rgba(255,69,0,0.5)] scale-110' 
                      : isPast 
                        ? 'border-accent bg-accent text-accent-foreground' 
                        : 'border-secondary bg-card text-muted-foreground'
                  }`}>
                    <Icon className={`h-4 w-4 ${isActive ? 'animate-pulse' : ''}`} />
                  </div>
                  <span className={`text-[10px] sm:text-xs font-bold uppercase absolute top-12 w-20 text-center -ml-5 ${
                    isActive ? 'text-accent' : isPast ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {!isModalView && (
        <div className="w-full space-y-3 mt-4">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-md bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-3.5 text-sm font-bold transition shadow-sm"
          >
            <MessageCircle className="h-5 w-5" />
            Chat on WhatsApp
          </a>
          
          <button
            onClick={onDone}
            className="w-full rounded-md bg-secondary text-secondary-foreground px-6 py-3 text-sm font-bold transition hover:bg-secondary/80 border border-border"
          >
            View All Orders
          </button>
        </div>
      )}
    </div>
  )
}
