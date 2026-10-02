'use client'

import { TrendingUp, ShoppingCart, CheckCircle, Clock } from 'lucide-react'
import { KPIMetrics } from '@/lib/admin-types'

interface KPICardsProps {
  metrics: KPIMetrics
}

export function KPICards({ metrics }: KPICardsProps) {
  const cards = [
    {
      title: 'Total Revenue',
      value: `Rs. ${metrics.totalRevenue.toLocaleString()}`,
      icon: <TrendingUp className="h-6 w-6" />,
      bgColor: 'bg-primary/10',
      textColor: 'text-primary',
      testId: 'total-revenue'
    },
    {
      title: 'Total Orders',
      value: metrics.totalOrders.toString(),
      icon: <ShoppingCart className="h-6 w-6" />,
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-500',
      testId: 'total-orders'
    },
    {
      title: 'Active Orders',
      value: metrics.activeOrders.toString(),
      icon: <ShoppingCart className="h-6 w-6" />,
      bgColor: 'bg-yellow-500/10',
      textColor: 'text-yellow-500',
    },
    {
      title: 'Completed Orders',
      value: metrics.completedOrders.toString(),
      icon: <CheckCircle className="h-6 w-6" />,
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-500',
    },
    {
      title: 'Avg TAT',
      value: `${metrics.avgDeliveryTime} mins`,
      icon: <Clock className="h-6 w-6" />,
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-500',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
      {cards.map((card, index) => (
        <div
          key={index}
          className="bg-card border border-border rounded-xl p-6 hover:border-accent/50 transition-colors"
        >
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">{card.title}</h3>
            <div className={`${card.bgColor} p-3 rounded-lg`}>
              <span className={card.textColor}>{card.icon}</span>
            </div>
          </div>
          <p data-testid={card.testId} className="font-heading font-bold text-2xl text-accent">{card.value}</p>
          <p className="text-xs text-muted-foreground mt-2">Updated in real-time</p>
        </div>
      ))}
    </div>
  )
}
