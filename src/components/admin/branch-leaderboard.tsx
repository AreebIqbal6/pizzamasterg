import { Trophy, TrendingUp, Medal, Clock, Bike, AlertTriangle } from "lucide-react"

type LeaderboardData = {
  name: string
  revenue: number
  orders: number
  avgTat: number
  activeRiders: number
  isSlammed: boolean
}

type Props = {
  data: LeaderboardData[]
}

export function BranchLeaderboard({ data }: Props) {
  if (!data || data.length === 0) return null

  return (
    <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-accent flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Leaderboard
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Real-time Multi-Branch Operations & Performance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {data.map((branch, index) => (
          <div 
            key={branch.name} 
            className={`relative overflow-hidden rounded-xl border p-5 ${
              branch.isSlammed 
                ? 'border-red-500/50 bg-red-500/10' 
                : index === 0 
                  ? 'border-yellow-500/50 bg-yellow-500/10' 
                  : index === 1 
                    ? 'border-slate-300/50 bg-slate-300/10' 
                    : index === 2
                      ? 'border-amber-700/50 bg-amber-700/10'
                      : 'border-border bg-background'
            }`}
          >
            {/* Background Icon */}
            {index < 3 && !branch.isSlammed && (
              <div className="absolute -right-4 -top-4 opacity-10">
                <Medal className="h-24 w-24" />
              </div>
            )}
            {branch.isSlammed && (
              <div className="absolute -right-4 -top-4 opacity-10">
                <AlertTriangle className="h-24 w-24 text-red-500" />
              </div>
            )}
            
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white ${
                  index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-amber-700' : 'bg-secondary-foreground text-secondary'
                }`}>
                  #{index + 1}
                </span>
                <h3 className="font-bold text-lg">{branch.name}</h3>
              </div>
              {branch.isSlammed && (
                <span className="animate-pulse rounded-full bg-red-500/20 px-2 py-1 text-xs font-bold text-red-500 border border-red-500/50">
                  SLAMMED
                </span>
              )}
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Revenue</p>
                <p className="text-xl font-extrabold text-foreground">Rs. {branch.revenue.toLocaleString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Orders</p>
                <p className="text-lg font-bold text-foreground flex items-center gap-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  {branch.orders}
                </p>
              </div>
              
              <div className="space-y-1 pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Avg TAT</p>
                <p className="text-md font-bold text-purple-400 flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {branch.avgTat} mins
                </p>
              </div>
              <div className="space-y-1 pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground uppercase font-semibold">Active Riders</p>
                <p className="text-md font-bold text-blue-400 flex items-center gap-1">
                  <Bike className="h-4 w-4" />
                  {branch.activeRiders}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
