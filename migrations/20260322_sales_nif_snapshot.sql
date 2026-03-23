-- Migration: Sales Customer NIF Snapshot
-- AGT Compliance: Store NIF at emission time to ensure immutability

ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_nif TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- Comentário para auditoria
COMMENT ON COLUMN sales.customer_nif IS 'NIF do cliente no momento da emissão. Necessário para integridade SAF-T.';
COMMENT ON COLUMN sales.customer_name IS 'Nome do cliente no momento da emissão.';
