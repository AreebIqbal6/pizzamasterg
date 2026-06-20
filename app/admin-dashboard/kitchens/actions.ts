"use server"

import { supabaseAdmin } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getKitchens() {
  const supabase = await createClient()

  // Fetch branches from DB
  const { data: branches, error: dbError } = await supabase
    .from('branches')
    .select('*')
    .order('created_at', { ascending: true })

  if (dbError) throw dbError

  // Fetch users from Auth via Admin API
  const { data: { users }, error: authError } = await supabaseAdmin.auth.admin.listUsers()

  if (authError) throw authError

  // Merge password info from user metadata
  const enrichedBranches = branches.map(branch => {
    const branchEmail = String(branch.email || "").trim().toLowerCase()
    const user = users.find(u =>
      u.user_metadata?.branch_id === branch.id ||
      u.id === branch.id ||
      (!!branchEmail && u.email?.toLowerCase() === branchEmail)
    )
    return {
      ...branch,
      email: user?.email || "",
      auth_id: user?.id || null,
      password: user?.user_metadata?.raw_password || "Not Set",
      has_account: !!user
    }
  })

  return enrichedBranches
}

export async function addKitchen(formData: FormData) {
  const name = formData.get('name') as string
  const location = formData.get('location') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  // 1. Create Auth User
  const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: 'kitchen',
      raw_password: password
    }
  })

  if (authError) return { error: authError.message }
  if (!userData.user) return { error: "Kitchen account was not created." }

  // 2. Insert into branches table
  const supabase = await createClient()
  const { error: dbError } = await supabase
    .from('branches')
    .insert([{ id: userData.user.id, name, location, email }])

  if (dbError) {
    // Rollback Auth user if DB insert fails
    await supabaseAdmin.auth.admin.deleteUser(userData.user.id)
    return { error: dbError.message }
  }

  await supabaseAdmin.auth.admin.updateUserById(userData.user.id, {
    user_metadata: {
      ...(userData.user.user_metadata || {}),
      role: 'kitchen',
      branch_id: userData.user.id,
      raw_password: password,
    },
  })

  revalidatePath('/admin-dashboard/kitchens')
  return { success: true }
}

export async function updateKitchen(formData: FormData) {
  const id = formData.get('id') as string // branch/auth id
  const authId = (formData.get('auth_id') as string) || id
  const name = formData.get('name') as string
  const location = formData.get('location') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const has_account = formData.get('has_account') === 'true'

  const supabase = await createClient()

  if (has_account) {
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(authId)
    const currentMetadata = existingUser.user?.user_metadata || {}

    // Update Auth User
    const updates: any = {
      email,
      email_confirm: true,
      user_metadata: {
        ...currentMetadata,
        role: 'kitchen',
        branch_id: id,
      }
    }
    
    if (password && password !== "Not Set") {
      updates.password = password
      updates.user_metadata.raw_password = password
    }

    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(authId, updates)
    if (authError) return { error: authError.message }
  } else {
    // If no account existed previously, we create it now and map it
    if (password && password !== "Not Set") {
      const { data: userData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: 'kitchen',
          branch_id: id,
          raw_password: password
        }
      })
      if (authError) return { error: authError.message }
      
      // Update branch with new auth ID (since branches and auth users share IDs usually)
      // Actually, if we update ID, we might break foreign keys. Let's not recreate auth for existing branch,
      // Wait, if it didn't exist, we just let them "Create" normally. For now we assume they have an account or we create one.
    }
  }

  // Update DB
  const { error: dbError } = await supabase
    .from('branches')
    .update({ name, location, email })
    .eq('id', id)

  if (dbError) return { error: dbError.message }

  revalidatePath('/admin-dashboard/kitchens')
  return { success: true }
}

export async function deleteKitchen(id: string) {
  const supabase = await createClient()
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  })
  const authUser = users.find(u => u.id === id || u.user_metadata?.branch_id === id)

  // Delete from DB first (or Auth first, Supabase cascades sometimes, but let's do both)
  const { error: dbError } = await supabase
    .from('branches')
    .delete()
    .eq('id', id)

  if (dbError) return { error: dbError.message }

  // Delete from Auth
  if (authUser?.id) {
    await supabaseAdmin.auth.admin.deleteUser(authUser.id)
  }
  
  // It's okay if Auth delete fails because they might not have had an auth account
  
  revalidatePath('/admin-dashboard/kitchens')
  return { success: true }
}
