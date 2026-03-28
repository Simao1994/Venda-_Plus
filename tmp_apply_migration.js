import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Supabase URL or Service Key missing.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function applyMigration() {
  const migrationPath = path.resolve('d:/Venda Plus/migrations/20260325_unify_hr_schema.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');
  console.log('Aplicando migração...');
  
  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  if (error) {
    console.error('Erro ao aplicar migração via RPC:', error);
    process.exit(1);
  }
  
  console.log('Migração aplicada com sucesso!', data);
}

applyMigration();
