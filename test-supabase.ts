import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase env variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('📡 Testing Supabase connection...');
    const { data, error } = await supabase.from('companies').select('count').single();

    if (error) {
        console.error('❌ Supabase error:', error.message);
    } else {
        console.log('✅ Supabase connected! Count:', data);
    }
}

test();
