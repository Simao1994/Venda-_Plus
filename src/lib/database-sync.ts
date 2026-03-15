import fs from 'fs';
import path from 'path';
import { runMigration } from './migrations-manager';

export async function syncDatabaseSchema() {
    try {
        console.log('🔄 Verificando atualizações da base de dados...');

        const schemaPath = path.join(process.cwd(), 'supabase_schema.sql');
        if (!fs.existsSync(schemaPath)) {
            console.warn('⚠️ Ficheiro supabase_schema.sql não encontrado. Ignorando sincronização base.');
        } else {
            const sql = fs.readFileSync(schemaPath, 'utf8');
            const cleanSql = sql
                .replace(/\/\*[\s\S]*?\*\/|([^:]|^)\/\/.*$/gm, '') // Remove comentários
                .trim();

            if (cleanSql) {
                // Apply the core schema as a tracked migration "initial_schema_20260314"
                await runMigration('initial_schema_20260314', cleanSql);
            }

            // Migration: Add register_id to sales for turn/shift tracking
            await runMigration('add_register_id_to_sales_20260315', `
                ALTER TABLE sales ADD COLUMN IF NOT EXISTS register_id INTEGER REFERENCES cash_registers(id) ON DELETE SET NULL;
            `);
        }

        console.log('✅ Verificação de base de dados concluída.');
    } catch (err: any) {
        console.error('💥 Erro fatal ao sincronizar base de dados:', err.message);
    }
}
