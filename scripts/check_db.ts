import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function check() {
  console.log('--- Ultimos Documentos (contabil_faturas) ---');
  const { data, error } = await supabase
    .from('contabil_faturas')
    .select('numero_fatura, status, valor_total, type_prefix, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching docs:', error);
  } else {
    console.table(data);
  }

  console.log('--- Ultimas Vendas (sales) ---');
  const { data: sales, error: sError } = await supabase
    .from('sales')
    .select('invoice_number, status, total, is_pro_forma, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (sError) {
    console.error('Error fetching sales:', sError);
  } else {
    console.table(sales);
  }
}

check();
