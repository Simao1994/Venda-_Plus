-- Migração para expandir dados socioeconómicos dos investidores
ALTER TABLE investidores 
ADD COLUMN IF NOT EXISTS escolaridade TEXT,
ADD COLUMN IF NOT EXISTS curso TEXT,
ADD COLUMN IF NOT EXISTS profissao TEXT,
ADD COLUMN IF NOT EXISTS estado_civil TEXT;

-- Garantir que as permissões RLS estão actualizadas (opcional se já existirem)
-- ALTER TABLE investidores ENABLE ROW LEVEL SECURITY;
