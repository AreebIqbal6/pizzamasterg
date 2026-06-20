import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  console.log('Fixing RLS policies...')
  
  const query = `
    DROP POLICY IF EXISTS "Enable read access for authenticated kitchen staff to their branch" ON public.orders;

    CREATE POLICY "Enable read access for authenticated kitchen staff to their branch" ON public.orders
    FOR SELECT USING (
      auth.role() = 'authenticated' AND 
      (
        -- If user is admin, can read all
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' OR
        -- If user is kitchen, can only read their branch
        ((auth.jwt() -> 'user_metadata' ->> 'role') = 'kitchen' AND branch_id::text = (auth.jwt() -> 'user_metadata' ->> 'branch_id'))
      )
    );
  `

  const { error } = await supabase.rpc('exec_sql', { query_text: query })
  
  if (error) {
    console.error('Error executing SQL via RPC:', error)
    console.log('Attempting alternative method (REST API)...')
    // We can also just use the postgres connection directly if needed, but let's see if the RPC works
  } else {
    console.log('Successfully updated RLS policies!')
  }
}

main().catch(console.error)
