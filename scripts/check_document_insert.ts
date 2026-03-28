import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDocumentCreation() {
  console.log('🔍 Verificando tabela contabil_faturas...\n');

  // 1. Check table structure
  console.log('1. A verificar estrutura da tabela...');
  const { data: sampleData, error: sampleError } = await supabase
    .from('contabil_faturas')
    .select('*')
    .limit(5);

  if (sampleError) {
    console.error('❌ Erro ao aceder à tabela:', sampleError);
  } else {
    console.log('✅ Tabela acessível');
    console.log('   Documentos existentes:', sampleData?.length || 0);
    if (sampleData && sampleData.length > 0) {
      console.log('   Colunas disponíveis:', Object.keys(sampleData[0]).join(', '));
      console.log('   Amostra:', JSON.stringify(sampleData[0], null, 2));
    }
  }

  // 2. Check for RLS policies
  console.log('\n2. A verificar políticas RLS...');
  const { data: policies, error: policyError } = await supabase
    .rpc('pg_catalog.pg_policies', { tablename: 'contabil_faturas' });

  if (policyError) {
    console.log('⚠️ Não foi possível obter políticas (pode não ter permissões)');
  } else {
    console.log('   Políticas encontradas:', policies?.length || 0);
  }

  // 3. Try to insert a test document
  console.log('\n3. A testar inserção de documento...');
  const testDoc = {
    numero_fatura: 'TEST-' + Date.now(),
    cliente_nome: 'Cliente Teste',
    data_emissao: new Date().toISOString().split('T')[0],
    valor_total: 100.00,
    status: 'PENDENTE',
    company_id: 1,
    tipo: 'Factura'
  };

  console.log('   Dados a inserir:', JSON.stringify(testDoc, null, 2));

  const { data: inserted, error: insertError } = await supabase
    .from('contabil_faturas')
    .insert(testDoc)
    .select()
    .single();

  if (insertError) {
    console.error('❌ Erro ao inserir:', insertError);
    console.error('   Código:', insertError.code);
    console.error('   Mensagem:', insertError.message);
  } else {
    console.log('✅ Documento inserido com sucesso!');
    console.log('   ID:', inserted.id);
    console.log('   Número:', inserted.numero_fatura);

    // 4. Verify the insert
    console.log('\n4. A verificar inserção...');
    const { data: verify, error: verifyError } = await supabase
      .from('contabil_faturas')
      .select('*')
      .eq('id', inserted.id)
      .single();

    if (verifyError) {
      console.error('❌ Erro ao verificar:', verifyError);
    } else {
      console.log('✅ Documento verificado com sucesso!');
      console.log('   Dados guardados:', JSON.stringify(verify, null, 2));
    }

    // 5. Delete test document
    console.log('\n5. A eliminar documento de teste...');
    await supabase.from('contabil_faturas').delete().eq('id', inserted.id);
    console.log('✅ Documento de teste eliminado');
  }

  // 6. Check billing_series
  console.log('\n6. A verificar séries de faturação...');
  const { data: series, error: seriesError } = await supabase
    .from('billing_series')
    .select('*');

  if (seriesError) {
    console.error('❌ Erro ao verificar séries:', seriesError);
  } else {
    console.log('✅ Séries encontradas:', series?.length || 0);
    series?.forEach(s => {
      console.log(`   - ${s.doc_type} (${s.series_name}): número ${s.last_number}`);
    });
  }
}

checkDocumentCreation()
  .then(() => {
    console.log('\n✅ Verificação concluída');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Erro inesperado:', err);
    process.exit(1);
  });
