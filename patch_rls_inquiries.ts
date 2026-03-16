import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://margarmxtxvmszzpxpjl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error('SUPABASE_SERVICE_ROLE_KEY missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function patchRLS() {
    const sql = `
    DROP POLICY IF EXISTS tenant_isolation ON public_inquiries;
    CREATE POLICY tenant_isolation ON public_inquiries FOR ALL USING (
        (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'master') 
        OR 
        (company_id = get_auth_tenant())
        OR
        (get_auth_tenant() IS NULL)
    );
  `;

    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
        console.error('Error patching RLS:', error);
    } else {
        console.log('Successfully patched RLS for public_inquiries');
    }
}

patchRLS();
