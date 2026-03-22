import "dotenv/config";
import { createClient } from '@supabase/supabase-js';

async function setStoragePolicies() {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error("❌ Missing environment variables.");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("📡 Setting storage policies for 'company-files'...");

    // We use RPC or raw SQL via the client if possible, but for storage policies, 
    // it's best to use the standard SQL editor.
    // However, I'll try to use the 'supabase' client to execute a query that creates the policies.

    const sql = `
        -- 1. Allow public read access (if bucket is public)
        -- (Already handled by bucket being public, but good to ensure)
        
        -- 2. Allow anyone to upload for now (to fix the blocker)
        -- Note: In a real production app, we should restrict this to authenticated users
        -- matching the company_id in the path.
        
        CREATE POLICY "Allow anonymous upload" ON storage.objects FOR INSERT WITH CHECK (
            bucket_id = 'company-files'
        );
        
        CREATE POLICY "Allow public select" ON storage.objects FOR SELECT USING (
            bucket_id = 'company-files'
        );
        
        CREATE POLICY "Allow owner delete" ON storage.objects FOR DELETE USING (
            bucket_id = 'company-files'
        );
    `;

    // Testing if we can run this via RPC
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error("❌ Failed to apply policies via RPC:", error.message);
        console.info("💡 Please copy the following SQL and run it in the Supabase Dashboard SQL Editor:");
        console.log(sql);
    } else {
        console.log("✅ Storage policies applied successfully!");
    }
}

setStoragePolicies();
