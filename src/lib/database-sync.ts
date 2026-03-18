import fs from 'fs';
import path from 'path';
import { runMigration } from './migrations-manager';

export async function syncDatabaseSchema() {
    try {
        console.log('🔄 Verificando atualizações da base de dados...');

        // 1. Core Schema (Baseline)
        const schemaPath = path.join(process.cwd(), 'supabase_schema.sql');
        if (fs.existsSync(schemaPath)) {
            const sql = fs.readFileSync(schemaPath, 'utf8');
            await runMigration('initial_schema_20260314', sql);
        }

        // 2. Automated Migrations Discovery
        const migrationsDir = path.join(process.cwd(), 'migrations');
        if (fs.existsSync(migrationsDir)) {
            const files = fs.readdirSync(migrationsDir)
                .filter(f => f.endsWith('.sql'))
                .sort(); // Natural sort order

            for (const file of files) {
                const filePath = path.join(migrationsDir, file);
                const sql = fs.readFileSync(filePath, 'utf8').trim();

                if (sql) {
                    // Use filename (without .sql extension) as unique migration key
                    const migrationName = file.replace('.sql', '');
                    await runMigration(migrationName, sql);
                }
            }
        }

        console.log('✅ Verificação de base de dados concluída.');
    } catch (err: any) {
        console.error('💥 Erro fatal ao sincronizar base de dados:', err.message);
    }
}
