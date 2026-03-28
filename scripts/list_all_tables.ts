import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  const { data, error } = await supabase.rpc('get_tables'); // This might not exist, trying raw SQL instead
  
  const { data: tables, error: sqlError } = await supabase.from('pg_catalog.pg_tables').select('tablename').eq('schemaname', 'public');
  
  if (sqlError) {
      // If direct access to pg_catalog is blocked, try a common table
      console.log('❌ SQL Error or access blocked to pg_catalog');
      // Try to just query something else or use a different approach
      return;
  }
  
  console.log('📋 Tabelas no esquema public:');
  tables?.forEach(t => console.log(` - ${t.tablename}`));
}

listTables();
