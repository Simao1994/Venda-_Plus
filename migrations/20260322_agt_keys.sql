-- Migration: AGT RSA Keys
-- Armazena as chaves RSA 2048 para certificação de documentos de acordo com a AGT

CREATE TABLE IF NOT EXISTS agt_keys (
    company_id INTEGER PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
    private_key TEXT NOT NULL,
    public_key TEXT NOT NULL,
    certificate_num TEXT, -- Ex: "0001/AGT/2026"
    key_version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Isolamento por empresa
ALTER TABLE agt_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agt_keys_tenant_isolation ON agt_keys;
CREATE POLICY agt_keys_tenant_isolation ON agt_keys FOR ALL USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'master')
    OR
    (company_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'company_id')::INTEGER)
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_agt_keys_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_agt_keys_updated_at
BEFORE UPDATE ON agt_keys
FOR EACH ROW
EXECUTE FUNCTION update_agt_keys_timestamp();
