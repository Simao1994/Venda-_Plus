import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Faltam variáveis de ambiente do Supabase.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
    console.log('🚀 Iniciando migração SQL...');
    
    const sqlPath = path.join(process.cwd(), 'migrations', '20260330_fix_investor_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // O supabase-js não tem um método direto para rodar SQL bruto arbitrário que altere tabelas 
    // com segurança via API REST padrão, então usamos a ferramenta de execução SQL do projeto se disponível
    // ou fazemos via RPC se houver uma função para isso.
    // Como estamos em ambiente de desenvolvimento local com Node, vamos tentar usar o endpoint de admin se possível.
    
    // Alternativa: Se houver uma função RPC para rodar SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
        console.error('❌ Erro ao aplicar migração via RPC:', error.message);
        console.log('Tentando outra abordagem...');
        
        // Se falhar, informaremos ao usuário para rodar manualmente ou tentaremos via CLI
        process.exit(1);
    } else {
        console.log('✅ Migração aplicada com sucesso!');
        process.exit(0);
    }
}

applyMigration();
