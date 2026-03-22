import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY!);

async function check() {
    console.log("Checking activity_logs table...");
    const { data, error } = await supabase.from('activity_logs').select('*').limit(5);
    if (error) {
        console.error("Error reading table:", error.message);
    } else {
        console.log("Logs limit 5:", data);
    }
}

check();
