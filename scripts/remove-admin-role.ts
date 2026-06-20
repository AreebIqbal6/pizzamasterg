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

async function demoteAdmins() {
  const emailsToDemote = ['iqbalareeb26@gmail.com', 'iareeb720@gmail.com']
  
  const { data, error } = await supabase.auth.admin.listUsers()
  if (error) {
    console.error("Failed to list users:", error)
    return
  }
  
  for (const email of emailsToDemote) {
    const user = data.users.find(u => u.email === email)
    if (user) {
      console.log(`Found ${email}, removing admin role...`)
      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, role: 'customer' }
      })
      if (updateError) {
        console.error(`Failed to update ${email}:`, updateError)
      } else {
        console.log(`Successfully demoted ${email} to customer.`)
      }
    } else {
      console.log(`${email} not found in database.`)
    }
  }
  
  console.log("Done demoting users.")
}

demoteAdmins()
