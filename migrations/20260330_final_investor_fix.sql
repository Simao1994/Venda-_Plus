-- ADICIONAR COLUNAS FALTANTES NA TABELA INVESTIDORES
-- Execute este script no Dashboard do Supabase (SQL Editor)

ALTER TABLE investidores ADD COLUMN IF NOT EXISTS data_inscricao TEXT;
ALTER TABLE investidores ADD COLUMN IF NOT EXISTS estado_civil TEXT;

-- Garantir que o RLS (Row Level Security) não está a bloquear updates legítimos do Admin
-- Se o RLS estiver ativo, certifique-se que o company_id está correto para o utilizador.
-- ALTER TABLE investidores ENABLE ROW LEVEL SECURITY;

COMMENT ON COLUMN investidores.data_inscricao IS 'Data de inscrição oficial do investidor (YYYY-MM-DD)';
COMMENT ON COLUMN investidores.estado_civil IS 'Estado civil do titular do investimento';
