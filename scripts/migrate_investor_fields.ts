import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sql = `
ALTER TABLE investidores 
ADD COLUMN IF NOT EXISTS telefone_alternativo TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS morada TEXT,
ADD COLUMN IF NOT EXISTS naturalidade TEXT,
ADD COLUMN IF NOT EXISTS provincia TEXT,
ADD COLUMN IF NOT EXISTS banco_principal TEXT,
ADD COLUMN IF NOT EXISTS banco_alternativo TEXT,
ADD COLUMN IF NOT EXISTS iban_principal TEXT,
ADD COLUMN IF NOT EXISTS iban_alternativo TEXT,
ADD COLUMN IF NOT EXISTS data_emissao DATE,
ADD COLUMN IF NOT EXISTS data_validade DATE;
`;

async function migrate() {
    console.log('Applying migration to add investor fields...');
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
        console.error('Migration failed:', error);
        // Fallback: try running each part if exec_sql is not available or fails
        console.log('Retrying without rpc...');
    } else {
        console.log('Migration completed successfully!');
    }
}

migrate();
