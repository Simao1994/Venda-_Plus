-- Add sequential number support for investors
ALTER TABLE investidores ADD COLUMN IF NOT EXISTS numero_sequencial INTEGER;

-- Create an index to speed up finding the next number
CREATE INDEX IF NOT EXISTS idx_investidores_numero_sequencial ON investidores(company_id, numero_sequencial DESC);
