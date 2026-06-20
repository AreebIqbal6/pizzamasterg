import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Fetching orders...');
  const { data, error } = await supabase.from('orders').select('*');
  console.log('Orders:', data);
  console.log('Error:', error);

  console.log('Testing insert...');
  const res = await supabase.from('orders').insert({
    total: 1200,
    status: 'pending',
    customer_name: 'Console Test',
    customer_address: 'Console Address',
    items: [{ id: 'test', name: 'Test Pizza', price: 1200, quantity: 1 }]
  }).select();
  console.log('Insert Result:', res);
}

run();
