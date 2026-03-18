import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://margarmxtxvmszzpxpjl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcmdhcm14dHh2bXN6enB4cGpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUwNzE1NywiZXhwIjoyMDg5MDgzMTU3fQ.0KiTIWpPWCkDqjaxWUNuO-HrzBFyRlWy580Szf59Bxg';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function check() {
    const { data: sales, error: err1 } = await supabase
        .from('sales')
        .select('id, is_certified')
        .eq('is_certified', true)
        .limit(1);

    if (err1) console.error('Error sales:', err1.message);
    else console.log('Has certified sales:', sales.length > 0);

    const { data: logs, error: err2 } = await supabase
        .from('activity_logs')
        .select('*')
        .limit(1);

    if (err2) console.error('Error logs:', err2.message);
    else {
        if (logs.length > 0) console.log('Log columns:', Object.keys(logs[0]));
        else console.log('No logs, but query succeeded.');
    }

    // Also manually test the creation of a log entry!
    const { data: insertLog, error: err3 } = await supabase
        .from('activity_logs')
        .insert({
            action: 'LOGIN',
            resource: 'USER',
            description: 'Test log entry',
            metadata: { debug: true }
        })
        .select('*');

    if (err3) console.error('Error inserting log:', err3.message);
    else console.log('Insert log success:', insertLog);

    process.exit(0);
}

check();
