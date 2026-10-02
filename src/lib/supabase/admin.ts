import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://x.supabase.co'),
  (process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy'),
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
