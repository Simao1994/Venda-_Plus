import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
    console.log("Testando RPC exec_sql...");
    try {
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1' });
        if (error) {
            console.error("Erro no RPC:", error);
        } else {
            console.log("RPC funciona!", data);
        }
    } catch (err) {
        console.error("Erro capturado:", err);
    }
}
main();
