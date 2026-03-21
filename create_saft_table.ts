import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(url, key);

const sql = `
CREATE TABLE IF NOT EXISTS saft_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  empresa_id INT,
  periodo_inicio DATE,
  periodo_fim DATE,
  data_exportacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_faturas INT,
  total_valor NUMERIC,
  status VARCHAR(20),
  ficheiro TEXT
);
`;

async function run() {
    console.log("Criando tabela saft_exports...");
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    if (error) {
        console.error("Erro ao criar tabela:", error);
    } else {
        console.log("Tabela criada com sucesso:", data);
    }
}

run();
