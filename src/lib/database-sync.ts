import fs from 'fs';
import path from 'path';
import { supabase } from './supabase';

export async function syncDatabaseSchema() {
    try {
        console.log('🔄 Iniciando sincronização automática da base de dados...');

        const schemaPath = path.join(process.cwd(), 'supabase_schema.sql');
        if (!fs.existsSync(schemaPath)) {
            console.warn('⚠️ Ficheiro supabase_schema.sql não encontrado. Ignorando sincronização.');
            return;
        }

        const sql = fs.readFileSync(schemaPath, 'utf8');

        // Divide o SQL por blocos significativos ou envia o bloco todo
        // Nota: O exec_sql no Postgres aguenta blocos grandes, mas vamos remover comentários vazios para limpar
        const cleanSql = sql
            .replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '') // Remove comentários
            .trim();

        if (!cleanSql) return;

        // Supabase RPC call to exec_sql
        const { error } = await supabase.rpc('exec_sql', { sql_query: cleanSql });

        if (error) {
            if (error.message.includes('function "exec_sql" does not exist')) {
                console.error('❌ Erro: A função "exec_sql" não existe na base de dados.');
                console.info('💡 Dica: Execute o conteúdo do ficheiro supabase_schema.sql manualmente uma vez no Dashboard do Supabase.');
            } else {
                console.error('❌ Erro na sincronização SQL:', error.message);
            }
        } else {
            console.log('✅ Base de dados sincronizada com sucesso!');
        }
    } catch (err: any) {
        console.error('💥 Erro fatal ao sincronizar base de dados:', err.message);
    }
}
