-- Migration: Add AGT Mandatory Phrases column
-- Stores the phrase "Processado/Emitido por programa validado..." required by AGT

ALTER TABLE sales ADD COLUMN IF NOT EXISTS agt_phrase TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS agt_phrase TEXT;
ALTER TABLE vendas_farmacia ADD COLUMN IF NOT EXISTS agt_phrase TEXT;
ALTER TABLE contabil_faturas ADD COLUMN IF NOT EXISTS agt_phrase TEXT;

-- Update existing records with default message for 2026
UPDATE sales SET agt_phrase = 'Processado por programa validado n.º 0000/AGT/2026' WHERE agt_phrase IS NULL;
UPDATE payments SET agt_phrase = 'Emitido por programa validado n.º 0000/AGT/2026' WHERE agt_phrase IS NULL;
UPDATE vendas_farmacia SET agt_phrase = 'Processado por programa validado n.º 0000/AGT/2026' WHERE agt_phrase IS NULL;
UPDATE contabil_faturas SET agt_phrase = 'Processado por programa validado n.º 0000/AGT/2026' WHERE agt_phrase IS NULL;
