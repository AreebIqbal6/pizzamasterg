"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Shield, Clock, Search, AlertTriangle, User } from "lucide-react"

type AuditLog = {
  id: string
  user_id: string
  user_email: string
  action: string
  target_id: string
  details: any
  created_at: string
}

export default function SecurityAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  
  const supabase = createClient()

  useEffect(() => {
    async function fetchLogs() {
      // In a real production system, this would be paginated
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100)
        
      if (!error && data) {
        setLogs(data)
      }
      setLoading(false)
    }
    
    fetchLogs()
  }, [supabase])

  const filteredLogs = logs.filter(log => 
    log.user_email?.toLowerCase().includes(search.toLowerCase()) || 
    log.action?.toLowerCase().includes(search.toLowerCase()) ||
    log.target_id?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading Audit Logs...</div>
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-accent">
              <Shield className="h-8 w-8" />
              Security & Audit Logs
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Immutable paper trail of all system mutations and employee actions.
            </p>
          </div>
          <div className="flex bg-secondary items-center rounded-lg px-3 py-2 border border-border min-w-[300px]">
            <Search className="h-4 w-4 text-muted-foreground mr-2" />
            <input 
              type="text" 
              placeholder="Search user, action, order ID..." 
              className="bg-transparent border-none text-sm w-full focus:outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-red-500">Immutable Logs</h3>
            <p className="text-xs text-muted-foreground mt-1">
              These records are structurally protected and cannot be deleted by standard admin or kitchen accounts. They track all critical mutations across the system.
            </p>
          </div>
        </div>

        {/* Logs Table */}
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/50 border-b border-border text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-6 py-4 font-semibold">Timestamp</th>
                  <th className="px-6 py-4 font-semibold">User</th>
                  <th className="px-6 py-4 font-semibold">Action</th>
                  <th className="px-6 py-4 font-semibold">Target ID</th>
                  <th className="px-6 py-4 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                      No logs match your search.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {new Date(log.created_at).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 font-mono text-xs">
                          <User className="h-3 w-3 text-accent" />
                          {log.user_email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="bg-accent/10 text-accent font-bold px-2 py-1 rounded text-xs">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                        {log.target_id || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <pre className="text-[10px] bg-secondary p-2 rounded text-muted-foreground overflow-x-auto max-w-[300px]">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
