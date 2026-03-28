
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Iniciando migração de investidores...');

  const sql = `
    ALTER TABLE investidores ADD COLUMN IF NOT EXISTS bi TEXT;
    ALTER TABLE investidores ADD COLUMN IF NOT EXISTS data_nascimento DATE;
    ALTER TABLE investidores ADD COLUMN IF NOT EXISTS endereco TEXT;
    ALTER TABLE investidores ADD COLUMN IF NOT EXISTS tipo_investidor TEXT;
    ALTER TABLE investidores ADD COLUMN IF NOT EXISTS senha TEXT;
  `;

  // Note: Standard Supabase user API doesn't allow DDL. 
  // We use this as a placeholder since we can't easily run raw SQL via the JS client without an RPC.
  // Given the environment, if this script isn't enough, we might need a different approach or manual intervention.
  console.log('SQL to execute:');
  console.log(sql);
  
  // Try using the project's internal REST API or RPC if available
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('❌ Erro na migração (RPC):', error.message);
    console.log('⚠️ Se o erro for "function exec_sql does not exist", a migração automática via script JS não é possível sem permissões de superusuário.');
  } else {
    console.log('✅ Migração concluída com sucesso!');
  }
}

runMigration();
