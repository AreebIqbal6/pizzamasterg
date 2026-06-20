import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function debugRLS() {
  const testEmail = `rls_debug_${Date.now()}@test.com`
  const testPassword = 'password123'
  
  // 1. Create mock branch
  const { data: branch, error: branchErr } = await supabaseAdmin.from('branches').insert({ name: 'RLS Debug Branch', location: 'Debug Loc' }).select().single()
  if (branchErr) console.error('Branch Err:', branchErr)
  const branchId = branch?.id

  // 2. Create kitchen user
  const { data: user } = await supabaseAdmin.auth.admin.createUser({
    email: testEmail,
    password: testPassword,
    email_confirm: true,
    user_metadata: { role: 'kitchen', branch_id: branchId }
  })

  // 3. Insert mock order
  const { data: order, error: orderErr } = await supabaseAdmin.from('orders').insert({
    customer_name: 'RLS Test Customer',
    total: 999,
    status: 'pending',
    branch_id: branchId
  }).select().single()

  if (orderErr) console.error('Order Err:', orderErr)
  console.log('Created Order:', order?.id, 'Branch:', branchId)

  // 4. Log in as kitchen user
  const { data: sessionData, error: loginError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  })
  if (loginError) console.error('Login Error:', loginError)
  
  console.log('Login JWT user_metadata:', sessionData?.session?.user?.user_metadata)
  
  // 5. Query orders as the kitchen user!
  const { data: myOrders, error: queryError } = await supabase.from('orders').select('*')
  
  console.log('Query Error:', queryError)
  console.log('Orders found:', myOrders?.length)
  if (myOrders && myOrders.length > 0) {
    console.log('SUCCESS! RLS allowed the read.')
  } else {
    console.log('FAILED! RLS dropped the rows.')
  }
  
  // Cleanup
  if (order?.id) await supabaseAdmin.from('orders').delete().eq('id', order.id)
  if (user?.user?.id) await supabaseAdmin.auth.admin.deleteUser(user.user.id)
  if (branchId) await supabaseAdmin.from('branches').delete().eq('id', branchId)
}

debugRLS().catch(console.error)
