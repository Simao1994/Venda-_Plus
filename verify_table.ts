
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verify() {
    console.log('Verifying rh_contas_bancarias...');

    // Method 1: RPC SQL
    const { data: rpcData, error: rpcError } = await supabase.rpc('exec_sql', {
        sql_query: "SELECT COUNT(*) FROM rh_contas_bancarias;"
    });

    if (rpcError) {
        console.log('Method 1 (RPC) Error:', rpcError.message);
    } else {
        console.log('Method 1 (RPC) Success:', rpcData);
    }

    // Method 2: Direct query
    const { data: qData, error: qError } = await supabase.from('rh_contas_bancarias').select('id').limit(1);

    if (qError) {
        console.log('Method 2 (Query) Error:', qError.message);
    } else {
        console.log('Method 2 (Query) Success: Table exists.');
    }
}

verify();
