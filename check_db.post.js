const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env manually since dotenv might not be in node_modules as a top-level dependency
const env = fs.readFileSync('.env', 'utf8');
const getEnv = (key) => env.split('\n').find(l => l.startsWith(key))?.split('=')[1]?.trim();

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY');

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Querying Supabase...');
    try {
        const { data: sales, error: sErr } = await supabase.from('sales').select('*').limit(1);
        console.log('Sales columns:', sales && sales.length > 0 ? Object.keys(sales[0]) : 'No data in sales');
        if (sErr) console.error('Sales error:', sErr);

        const { data: farmacia, error: fErr } = await supabase.from('vendas_farmacia').select('*').limit(1);
        console.log('Farmacia columns:', farmacia && farmacia.length > 0 ? Object.keys(farmacia[0]) : 'No data in vendas_farmacia');
        if (fErr) console.error('Farmacia error:', fErr);

        const { data: companies, error: cErr } = await supabase.from('empresas').select('id, nome').limit(5);
        console.log('Companies:', companies);
    } catch (e) {
        console.error('Fatal error:', e);
    }
}

check();
