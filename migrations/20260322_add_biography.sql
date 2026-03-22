-- Add Professional Biography fields to companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bio_nome TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bio_foto TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bio_formacao TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bio_profissao TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bio_competencias TEXT[];
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bio_contactos TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bio_emails TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bio_resumo TEXT;
