
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://margarmxtxvmszzpxpjl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  const migrationPath = path.join(process.cwd(), 'fix_blog_inquiries.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  console.log('Applying migration...');

  // Use the exec_sql function if it exists, or just try to run it directly if the library supports it.
  // Supabase JS doesn't have a direct 'execute raw sql' apart from rpc for security reasons.
  // Actually, wait, Supabase JS doesn't have a direct way to run raw DDL unless using rpc to an exec_sql function.

  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }

  console.log('Migration applied successfully!');
}

applyMigration();
