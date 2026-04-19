import { supabase } from "./src/lib/supabase.ts";

async function run() {
  const sql = `
    DO $$ 
    BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'permissions') THEN
            ALTER TABLE users ADD COLUMN permissions JSONB DEFAULT '{}'::jsonb;
        END IF;
    END $$;
  `;

  console.log('Applying migration: Add permissions column to users table...');
  const { error } = await (supabase as any).rpc('exec_sql', { sql_query: sql });

  if (error) {
    console.error('Error applying migration:', error.message);
    process.exit(1);
  }

  console.log('Migration applied successfully!');
  process.exit(0);
}

run();
