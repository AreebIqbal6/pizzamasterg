import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

async function checkRealtime() {
  const { data, error } = await supabaseAdmin.rpc('exec_sql', { query_text: `
    SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
  ` })
  
  if (error) {
    console.log('RPC failed, trying pg directly? No, just using a simple realtime test.')
    
    // Let's test realtime directly!
    let received = false
    const channel = supabaseAdmin.channel('test-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        console.log('REALTIME EVENT RECEIVED:', payload)
        received = true
      })
      .subscribe()
      
    await new Promise(r => setTimeout(r, 2000))
    
    console.log('Inserting order to trigger realtime...')
    const { data: order } = await supabaseAdmin.from('orders').insert({
      customer_name: 'Realtime Test',
      total: 100,
      status: 'pending'
    }).select().single()
    
    await new Promise(r => setTimeout(r, 3000))
    
    if (received) {
      console.log('SUCCESS! Realtime is working for orders.')
    } else {
      console.log('FAILED! Realtime is NOT working. The table is likely not in the supabase_realtime publication.')
    }
    
    if (order) await supabaseAdmin.from('orders').delete().eq('id', order.id)
    await supabaseAdmin.removeChannel(channel)
  }
}

checkRealtime().catch(console.error)
