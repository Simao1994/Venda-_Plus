import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function check() {
  console.log('--- DB SCHEMA CHECK ---');
  const { data, error } = await supabase.from('contabil_faturas').select('*').limit(1);
  if (error) {
    console.error('Error fetching record:', error);
  } else if (data && data.length > 0) {
    console.log('Columns found in record:', Object.keys(data[0]));
    console.log('Sample record:', JSON.stringify(data[0], null, 2));
  } else {
    console.log('No records found in contabil_faturas.');
  }
}
check();
