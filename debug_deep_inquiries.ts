import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://margarmxtxvmszzpxpjl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkInquiriesForCompany6() {
    console.log('--- Checking all inquiries (Service Role) ---');
    const { data: allInquiries, error: allErr } = await supabase.from('public_inquiries').select('*');
    console.log('Total inquiries in DB:', allInquiries?.length);
    console.log(allInquiries);

    console.log('\n--- Checking companies ---');
    const { data: companies } = await supabase.from('companies').select('id, name');
    console.log('Companies:', companies);

    console.log('\n--- Checking users ---');
    const { data: users } = await supabase.from('users').select('id, email, company_id, role');
    console.log('Users:', users);
}

checkInquiriesForCompany6();
