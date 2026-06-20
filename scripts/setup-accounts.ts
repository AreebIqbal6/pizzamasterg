import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE URL or SERVICE KEY")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function run() {
  console.log("Setting up Admin Accounts...")
  const admins = ['iqbalareeb26@gmail.com', 'admin@pizzamasterg.com']
  for (const email of admins) {
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email,
      password: '123456',
      email_confirm: true,
      user_metadata: { role: 'admin', raw_password: '123456' }
    })
    
    if (userError && userError.message.includes('already registered')) {
      console.log(`Admin ${email} already registered, updating password...`)
      const list = await supabase.auth.admin.listUsers()
      const u = list.data.users.find(u => u.email === email)
      if (u) {
         await supabase.auth.admin.updateUserById(u.id, { 
           password: '123456', 
           user_metadata: { role: 'admin', raw_password: '123456' } 
         })
      }
    } else if (userError) {
      console.error(`Failed to create admin ${email}:`, userError)
    } else {
      console.log(`Admin ${email} ready.`)
    }
  }

  console.log("Setting up Kitchen Accounts...")
  const { data: branches, error: branchError } = await supabase.from('branches').select('*')
  if (branchError) {
    console.error("Failed to fetch branches:", branchError)
    return
  }

  for (const branch of branches) {
    const email = branch.email || `pizzamasterg${branch.name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@gmail.com`
    const { data: user, error: userError } = await supabase.auth.admin.createUser({
      email,
      password: '123456', // I will set 123456 to all branches
      email_confirm: true,
      user_metadata: { role: 'kitchen', raw_password: '123456' }
    })
    
    if (userError && userError.message.includes('already registered')) {
      console.log(`Kitchen ${email} already registered, updating password...`)
      const list = await supabase.auth.admin.listUsers()
      const u = list.data.users.find(u => u.email === email)
      if (u) {
         await supabase.auth.admin.updateUserById(u.id, { 
           password: 'password123', 
           user_metadata: { role: 'kitchen', raw_password: 'password123' } 
         })
      }
    } else if (userError) {
      console.error(`Failed to create kitchen ${email}:`, userError)
    } else {
      console.log(`Kitchen ${email} ready.`)
    }
  }
  console.log("Done.")
}

run()
