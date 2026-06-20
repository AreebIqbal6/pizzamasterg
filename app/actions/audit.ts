"use server"

import { createClient } from "@/lib/supabase/server"

export async function logAuditAction(action: string, targetId?: string, details?: any) {
  const supabase = createClient()
  
  // We need to fetch the current user's info since they are the ones performing the action.
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.warn("Attempted to log action without authenticated user:", action)
    return
  }

  const { error } = await supabase
    .from('audit_logs')
    .insert([
      {
        user_id: user.id,
        user_email: user.email || 'unknown',
        action: action,
        target_id: targetId || null,
        details: details || {}
      }
    ])

  if (error) {
    console.error("Failed to insert audit log:", error)
  }
}
