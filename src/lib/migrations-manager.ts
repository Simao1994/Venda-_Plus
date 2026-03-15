import { supabase } from './supabase';

export async function runMigration(name: string, sql: string) {
    try {
        // 1. Check if migration already executed
        const { data: existing, error: fetchError } = await supabase
            .from('system_migrations')
            .select('id')
            .eq('name', name)
            .maybeSingle();

        if (fetchError &&
            !fetchError.message.includes('relation "system_migrations" does not exist') &&
            !fetchError.message.includes('Could not find the table')
        ) {
            console.error(`❌ Erro ao verificar migração ${name}:`, fetchError.message);
            return;
        }

        if (existing) {
            return; // Already executed
        }

        console.log(`📡 Aplicando migração: ${name}...`);

        // 2. Execute SQL
        const { error: execError } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (execError) {
            console.error(`❌ Falha na migração ${name}:`, execError.message);
            throw execError;
        }

        // 3. Record migration
        const { error: recordError } = await supabase
            .from('system_migrations')
            .insert([{ name }]);

        if (recordError) {
            console.error(`⚠️ Migração ${name} aplicada mas falhou ao registar:`, recordError.message);
        } else {
            console.log(`✅ Migração ${name} aplicada com sucesso.`);
        }
    } catch (err: any) {
        console.error(`💥 Erro crítico na migração ${name}:`, err.message);
    }
}
