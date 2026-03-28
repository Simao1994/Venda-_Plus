
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  const sql = `
    ALTER TABLE investimentos_lancamentos ADD COLUMN IF NOT EXISTS saque DECIMAL(15,2) DEFAULT 0;
    ALTER TABLE investimentos_lancamentos ADD COLUMN IF NOT EXISTS multa DECIMAL(15,2) DEFAULT 0;
    
    -- Ajustar a trigger de resultados para incluir saques e multas
    -- Note: This is a complex DDL change that might require dropping/creating the trigger.
    -- For now we just add the columns. 
  `;

  const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
  if (error) {
    console.error('❌ Migration error:', error.message);
  } else {
    console.log('✅ Migration success: saque and multa columns added.');
  }
}

runMigration();
