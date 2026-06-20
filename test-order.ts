import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log('Testing order insertion...');
  const { data, error } = await supabase.from('orders').insert({
    total: 1000,
    status: 'pending',
    customer_name: 'Test Guest',
    customer_address: '123 Test St',
    items: [{ id: '1', name: 'Pizza', price: 1000, quantity: 1 }]
  }).select();

  console.log('Insert Result Data:', data);
  if (error) {
    console.error('Insert Error:', JSON.stringify(error, null, 2));
  } else {
    console.log('Testing fetch...');
    const { data: fetch, error: fErr } = await supabase.from('orders').select('*').limit(1);
    console.log('Fetch Data:', fetch);
    console.log('Fetch Error:', fErr);
  }
}

runTest();
