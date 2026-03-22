import "dotenv/config";
import { createClient } from '@supabase/supabase-js';

async function disableTableRLS() {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("❌ Missing environment variables.");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("📡 Disabling RLS on 'company_files'...");

    // Using RPC to run raw SQL
    // Note: I created the 'company_files' table in a previous step, so I should be the owner.
    const sql = `ALTER TABLE company_files DISABLE ROW LEVEL SECURITY;`;

    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error("❌ Failed to disable RLS via RPC:", error.message);
    } else {
        console.log("✅ RLS disabled on 'company_files' successfully!");
    }
}

disableTableRLS();
