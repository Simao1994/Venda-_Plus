import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://margarmxtxvmszzpxpjl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCompanies() {
    const { data: companies, error } = await supabase.from('companies').select('*');
    if (error) {
        console.error('Error fetching companies:', error);
    } else {
        console.log('Companies found:', companies);
    }
}

checkCompanies();
