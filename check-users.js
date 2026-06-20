const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkUsers() {
  const { data: users, error } = await supabaseAdmin.auth.admin.listUsers()
  if (error) {
    console.error(error)
    return
  }
  
  console.log("Found", users.users.length, "users.")
  
  for (const user of users.users) {
    console.log(`User: ${user.email} | Role: ${user.user_metadata?.role || 'NONE'}`)
    
    // Auto-fix missing roles
    let targetRole = null
    if (['iqbalareeb26@gmail.com', 'iareeb720@gmail.com'].includes(user.email)) {
      targetRole = 'admin'
    } else if (user.email === 'pizzamastergmukkachowk@gmail.com') {
      targetRole = 'kitchen_staff' // Wait, check login logic: it expects 'kitchen' or 'kitchen_staff'?
    }
    
    if (targetRole && user.user_metadata?.role !== targetRole) {
      console.log(`Fixing role for ${user.email} to ${targetRole}...`)
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, role: targetRole }
      })
    }
  }
}

checkUsers()
