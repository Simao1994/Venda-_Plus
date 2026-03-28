import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('🔍 Verificando tabelas no Supabase...\n');

  const tablesToCheck = ['investimentos', 'lancamentos', 'investidores', 'resultados_finais_investimentos'];

  for (const table of tablesToCheck) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);

    if (error) {
      if (error.code === '42P01') {
        console.log(`❌ Tabela '${table}' não existe.`);
      } else {
        console.error(`⚠️ Erro ao verificar tabela '${table}':`, error.message);
      }
    } else {
      console.log(`✅ Tabela '${table}' existe.`);
      // Check columns
      if (data && data.length > 0) {
        console.log(`   Colunas: ${Object.keys(data[0]).join(', ')}`);
      } else {
          // If no data, try to get column names via RPC or a fake insert (not ideal)
          // For now just say it exists
          console.log(`   Tabela vazia, mas existe.`);
      }
    }
  }
}

checkTables();
