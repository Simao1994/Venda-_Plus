import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://margarmxtxvmszzpxpjl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function findTables() {
    const { data: tables, error } = await supabase.rpc('exec_sql', { sql_query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'" });
    if (error) console.error(error);
    console.log('Tables:', tables);
}

findTables();
