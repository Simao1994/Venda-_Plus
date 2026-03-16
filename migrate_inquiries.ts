import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://margarmxtxvmszzpxpjl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateInquiries() {
    const { data, error } = await supabase
        .from('public_inquiries')
        .update({ company_id: 6 })
        .match({ company_id: 1 });

    if (error) {
        console.error('Error migrating inquiries:', error);
    } else {
        console.log('Successfully migrated inquiries to company 6');
    }
}

migrateInquiries();
