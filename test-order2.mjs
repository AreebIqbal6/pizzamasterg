import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('Testing insert without .select()...');
  const res = await supabase.from('orders').insert({
    total: 1200,
    status: 'pending',
    customer_name: 'Console Test 2',
    customer_address: 'Console Address',
    items: [{ id: 'test', name: 'Test Pizza', price: 1200, quantity: 1 }]
  }); // NO .select()
  console.log('Insert Result:', res);
}

run();
