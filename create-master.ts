import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createMasterUser() {
    console.log('--- Criando Utilizador Master ---');

    const email = 'simaopambo94@gmail.com';
    const password = 'leonora1994';
    const hashedPassword = bcrypt.hashSync(password, 10);

    // 1. Garante que a empresa Master existe
    const { data: company, error: cError } = await supabase
        .from('companies')
        .upsert({ id: 1, name: 'VENDA PLUS MASTER', email: email, status: 'active' })
        .select()
        .single();

    if (cError) {
        console.error('❌ Erro ao criar empresa:', cError.message);
        return;
    }
    console.log('✅ Empresa Master verificada.');

    // 2. Cria o utilizador
    const { data: user, error: uError } = await supabase
        .from('users')
        .upsert({
            name: 'Administrador Master',
            email: email,
            password: hashedPassword,
            role: 'master',
            company_id: 1
        }, { onConflict: 'email' })
        .select()
        .single();

    if (uError) {
        console.error('❌ Erro ao criar utilizador:', uError.message);
        if (uError.message.includes('permission denied')) {
            console.info('💡 Dica: Sem permissões de ADMIN. Você precisa rodar o SQL manualmente no dashboard ou usar a Service Role Key.');
        }
    } else {
        console.log('✅ Utilizador Master criado com sucesso!', user.email);
    }
}

createMasterUser();
