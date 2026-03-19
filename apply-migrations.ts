import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://margarmxtxvmszzpxpjl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcmdhcm14dHh2bXN6enB4cGpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUwNzE1NywiZXhwIjoyMDg5MDgzMTU3fQ.0KiTIWpPWCkDqjaxWUNuO-HrzBFyRlWy580Szf59Bxg';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function applyMigrations() {
    const files = [
        'migrations/20260319_inventory_v2.sql',
        'migrations/20260319_missing_pharmacy_tables.sql',
        'migrations/MIGRATION_NEW_MODULES.sql',
        'migrations/fix_bank_accounts.sql',
        'migrations/fix_hr_columns.sql'
    ];

    for (const file of files) {
        console.log(`Applying ${file}...`);
        const sql = fs.readFileSync(path.resolve(process.cwd(), file), 'utf8');

        // We can't use exec_sql if it's not defined, but server.ts uses it!
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
        if (error) {
            console.error(`Error applying ${file}:`, error.message);
        } else {
            console.log(`Successfully applied ${file}`);
        }
    }
}

applyMigrations().then(() => process.exit(0)).catch(console.error);
