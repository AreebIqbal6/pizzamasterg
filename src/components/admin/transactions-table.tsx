'use client'

import { useState } from 'react'
import { AdminTransaction } from '@/lib/admin-types'
import { CheckCircle, XCircle } from 'lucide-react'

interface TransactionsTableProps {
  transactions: AdminTransaction[]
}

function getStatusColor(status: string) {
  switch (status) {
    case 'Completed':
      return 'bg-green-500/10 text-green-500'
    case 'Cancelled':
      return 'bg-red-500/10 text-red-500'
    case 'Pending':
      return 'bg-yellow-500/10 text-yellow-500'
    default:
      return 'bg-gray-500/10 text-gray-500'
  }
}

function formatDate(date: Date) {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function TransactionsTable({ transactions }: TransactionsTableProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const displayedTransactions = isExpanded ? transactions : transactions.slice(0, 10)

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-6 border-b border-border">
        <h2 className="text-lg font-heading font-bold text-accent">
          {isExpanded ? "All Transactions" : "Recent Transactions"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">Completed orders across all branches</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="px-6 py-4 text-left text-sm font-semibold text-accent">Order ID</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-accent">Branch</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-accent">Customer</th>
              <th className="px-6 py-4 text-right text-sm font-semibold text-accent">Amount</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-accent">Payment Method</th>
              <th className="px-6 py-4 text-center text-sm font-semibold text-accent">Status</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-accent">Time</th>
            </tr>
          </thead>
          <tbody>
            {displayedTransactions.map((txn) => (
              <tr key={txn.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                <td className="px-6 py-4 text-sm font-medium text-accent">{txn.orderId}</td>
                <td className="px-6 py-4 text-sm text-foreground">{txn.branch}</td>
                <td className="px-6 py-4 text-sm text-foreground">{txn.customer}</td>
                <td className="px-6 py-4 text-sm font-semibold text-accent text-right">
                  Rs. {txn.totalAmount.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-sm text-foreground">{txn.paymentMethod}</td>
                <td className="px-6 py-4">
                  <div className="flex justify-center">
                    <div
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(txn.status)}`}
                    >
                      {txn.status === 'Completed' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      {txn.status}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(txn.timestamp)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {transactions.length > 10 && (
        <div className="px-6 py-4 border-t border-border bg-secondary/30 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">Showing {displayedTransactions.length} of {transactions.length} transactions</p>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-semibold text-accent hover:text-accent/80 transition-colors"
          >
            {isExpanded ? "View Less ↑" : "View All →"}
          </button>
        </div>
      )}
    </div>
  )
}
