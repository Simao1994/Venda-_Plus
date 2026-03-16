import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkVagas() {
    console.log('Checking table rh_vagas...');

    const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: "SELECT table_name FROM information_schema.tables WHERE table_name = 'rh_vagas';"
    });

    if (error) {
        console.log('Error checking table via RPC:', error.message);
    } else if (data && data.length > 0) {
        console.log('Table rh_vagas exists.');
    } else {
        console.log('Table rh_vagas DOES NOT exist.');
    }

    // Check RLS policies
    const { data: policies, error: polErr } = await supabase.rpc('exec_sql', {
        sql_query: "SELECT policyname, cmd, qual FROM pg_policies WHERE tablename = 'rh_vagas';"
    });

    if (!polErr) {
        console.log('Policies for rh_vagas:', policies);
    }
}

checkVagas();
