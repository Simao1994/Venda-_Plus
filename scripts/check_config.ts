import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function check() {
  console.log('--- Filiais (branches) ---');
  const { data: branches, error: bError } = await supabase.from('branches').select('*');
  if (bError) console.error(bError); else console.table(branches);

  console.log('--- Utilizadores (users) ---');
  const { data: users, error: uError } = await supabase.from('users').select('id, email, company_id, branch_id, role');
  if (uError) console.error(uError); else console.table(users);
  
  console.log('--- Empresas (companies) ---');
  const { data: companies, error: cError } = await supabase.from('companies').select('id, name');
  if (cError) console.error(cError); else console.table(companies);
}

check();
