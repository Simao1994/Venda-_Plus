
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://margarmxtxvmszzpxpjl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1hcmdhcm14dHh2bXN6enB4cGpsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzUwNzE1NywiZXhwIjoyMDg5MDgzMTU3fQ.0KiTIWpPWCkDqjaxWUNuO-HrzBFyRlWy580Szf59Bxg';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const tables = [
    'medicamentos',
    'fornecedores_farmaceuticos',
    'lotes_medicamentos',
    'movimentos_stock_farmacia',
    'vendas_farmacia',
    'itens_venda_farmacia',
    'clientes_farmacia',
    'receitas_medicas',
    'itens_receita_medica',
    'compras_farmacia',
    'itens_compra_farmacia',
    'pharmacy_inventory_sessions',
    'pharmacy_inventory_session_items'
];

async function checkTables() {
    for (const table of tables) {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`❌ Table ${table}:`, error.message);
        } else {
            console.log(`✅ Table ${table}: EXISTS`);
        }
    }
}

checkTables();
