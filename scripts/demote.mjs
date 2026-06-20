import fs from 'fs'

const envFile = fs.readFileSync('.env.local', 'utf-8')
const env = {}
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    env[match[1].trim()] = match[2].trim()
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY

async function demote() {
  console.log("Fetching users...")
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`
    }
  })
  const data = await res.json()
  
  const emails = ['iqbalareeb26@gmail.com', 'iareeb720@gmail.com']
  for (const email of emails) {
    const user = data.users?.find(u => u.email === email)
    if (user) {
      console.log(`Demoting ${email}...`)
      const updateRes = await fetch(`${supabaseUrl}/auth/v1/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_metadata: { ...user.user_metadata, role: null }
        })
      })
      const updateData = await updateRes.json()
      console.log(`Result for ${email}:`, updateData.user_metadata)
    } else {
      console.log(`${email} not found`)
    }
  }
}

demote().catch(console.error)
