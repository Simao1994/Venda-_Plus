import { supabase } from './src/lib/supabase';
import bcrypt from 'bcryptjs';

async function diagnose() {
    console.log('--- Diagnóstico Detalhado ---');

    // Test 1: Check Connection
    const { count, error: connError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

    if (connError) {
        console.error('❌ Erro de conexão/permissão:', connError.message);
    } else {
        console.log('✅ Conexão OK. Total de utilizadores visíveis:', count);
    }

    // Test 2: List all emails (for debugging only)
    const { data: users, error: listError } = await supabase
        .from('users')
        .select('email, role');

    if (listError) {
        console.error('❌ Erro ao listar utilizadores:', listError.message);
    } else {
        console.log('Utilizadores encontrados:', users?.map(u => `${u.email} (${u.role})`) || 'Nenhum');
    }

    // Test 3: Check simaopambo94 specifically
    const targetEmail = 'simaopambo94@gmail.com';
    const { data: target, error: targetError } = await supabase
        .from('users')
        .select('*')
        .eq('email', targetEmail);

    if (targetError) {
        console.error(`❌ Erro ao procurar ${targetEmail}:`, targetError.message);
    } else if (target && target.length > 0) {
        console.log(`✅ O utilizador ${targetEmail} EXISTE!`);
        const match = bcrypt.compareSync('leonora1994', target[0].password);
        console.log(match ? '✅ Senha confere!' : '❌ Senha NÃO confere!');
    } else {
        console.error(`❌ O utilizador ${targetEmail} NÃO EXISTE na base de dados.`);
        console.info('💡 Ação necessária: Copiar o conteúdo de supabase_schema.sql e rodar no Dashboard do Supabase.');
    }
}

diagnose();
