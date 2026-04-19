-- Adicionar colunas faltantes identificadas na análise de payload
ALTER TABLE investidores ADD COLUMN IF NOT EXISTS nacionalidade TEXT;
ALTER TABLE investidores ADD COLUMN IF NOT EXISTS data_nascimento TEXT;
ALTER TABLE investidores ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Ativo';
