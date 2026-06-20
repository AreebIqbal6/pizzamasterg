import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function debugLogin() {
  const email = `curl_admin_${Date.now()}@pizzamasterg.com`
  const password = 'password123'
  
  await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role: 'admin' }
  })
  
  // Now hit the login page action?
  // Actually, wait, Next.js Server Actions require special headers like Next-Action.
  // It's easier to just use Supabase auth client in Node and see if there is any anomaly with the session.
  // Or, I can write a tiny script to test if the Next.js dev server is receiving the cookies.
  
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password })
  console.log('SignIn Error:', error)
  console.log('Session exists:', !!data.session)
  console.log('User Role:', data.user?.user_metadata?.role)
  
  if (data.user) {
    await supabaseAdmin.auth.admin.deleteUser(data.user.id)
  }
}

debugLogin().catch(console.error)
