'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { BranchRevenue } from '@/lib/admin-types'

interface RevenueChartProps {
  data: BranchRevenue[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 mb-8">
      <h2 className="text-lg font-heading font-bold text-accent mb-6">Revenue by Branch</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#333333" vertical={false} />
          <XAxis
            dataKey="branch"
            stroke="#888888"
            style={{ fontSize: '12px' }}
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis stroke="#888888" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333333',
              borderRadius: '8px',
              color: '#fbbf24',
            }}
            formatter={(value) => `Rs. ${(value as number).toLocaleString()}`}
            cursor={{ fill: 'rgba(251, 191, 36, 0.1)' }}
          />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="square"
          />
          <Bar
            dataKey="revenue"
            fill="#fbbf24"
            radius={[8, 8, 0, 0]}
            name="Daily Revenue (Rs.)"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
