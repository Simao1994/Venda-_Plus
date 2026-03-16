
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    console.log('Listing all tables...');

    const { data, error } = await supabase.rpc('exec_sql', {
        sql_query: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
    });

    if (error) {
        console.error('Error listing tables:', error);
        process.exit(1);
    }

    console.log('Tables found:');
    if (data) {
        data.forEach((row: any) => console.log(`- ${row.table_name}`));
    } else {
        console.log('No tables found.');
    }
}

listTables();
