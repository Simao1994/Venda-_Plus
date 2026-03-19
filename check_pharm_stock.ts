
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://margarmxtxvmszzpxpjl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcmdhcm14dHh2bXN6enB4cGpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUwNzE1NywiZXhwIjoyMDg5MDgzMTU3fQ.0KiTIWpPWCkDqjaxWUNuO-HrzBFyRlWy580Szf59Bxg';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkTable() {
    console.log('Checking table movimentos_stock_farmacia...');
    const { data, error } = await supabase
        .from('movimentos_stock_farmacia')
        .select('*')
        .limit(1);

    if (error) {
        console.log('❌ Error querying table:', error.message);
    } else {
        console.log('✅ Table exists! Found:', data);
    }
}

checkTable();
