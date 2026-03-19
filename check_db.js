import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function check() {
    console.log('Querying Supabase...');
    try {
        const { data: v, error: vErr } = await supabase.from('vendas_farmacia').select('*').limit(1);
        console.log('Pharmacy sales columns:', v && v.length > 0 ? Object.keys(v[0]) : 'No data');
    } catch (e) {
        console.error('Fatal error:', e);
    }
}

check();
