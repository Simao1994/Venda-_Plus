import "dotenv/config";
import { supabase } from './src/lib/supabase';
import fs from 'fs';
import path from 'path';

async function runAgtMigration() {
    console.log('🚀 Iniciando migração AGT...');
    const sqlPath = path.join(process.cwd(), 'migrations', 'agt_integration.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error('❌ Erro ao executar migração:', error);
    } else {
        console.log('✅ Migração AGT concluída com sucesso!');
    }
}

runAgtMigration();
