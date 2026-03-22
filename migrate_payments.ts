import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function migrate() {
  console.log('--- DB MIGRATION: Payment Fields ---');
  
  // Note: We use raw RPC if available, otherwise we'd need a different approach.
  // Since we suspect the MCP tool is failing but the direct JS client works for data,
  // we'll try to use a dummy record update/select to check but we really need DDL.
  
  // Actually, I'll try to use the MCP execute_sql again with a smaller query,
  // but if that fails, I will use a different trick: 
  // I'll try to see if I can add the column via a simple update with a new field (Supabase/PostgREST doesn't support this for DDL).
  
  console.log('Attempting to use direct RPC for DDL if enabled...');
  
  const { data, error } = await supabase.rpc('exec_sql', {
    sql_query: `
      ALTER TABLE contabil_faturas ADD COLUMN IF NOT EXISTS valor_pago DECIMAL(15,2) DEFAULT 0;
      ALTER TABLE contabil_faturas ADD COLUMN IF NOT EXISTS valor_em_divida DECIMAL(15,2) DEFAULT 0;
      ALTER TABLE contabil_faturas ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
      ALTER TABLE contabil_faturas ADD COLUMN IF NOT EXISTS tipo TEXT;
      
      -- Update existing records to be consistent
      UPDATE contabil_faturas SET valor_em_divida = valor_total WHERE valor_em_divida IS NULL OR valor_em_divida = 0;
      UPDATE contabil_faturas SET valor_pago = valor_total, valor_em_divida = 0, status = 'PAGO' WHERE status = 'Pago';
    `
  });

  if (error) {
    console.error('Error during migration RPC:', error);
    console.log('If RPC fails, the columns must be added manually via Supabase Dashboard.');
  } else {
    console.log('Migration successful:', data);
  }
}

migrate();
