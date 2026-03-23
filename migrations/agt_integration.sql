-- Migration to support AGT Webservice Integration UI and Persistence

CREATE TABLE IF NOT EXISTS agt_configs (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    nif_empresa TEXT,
    username TEXT,
    password TEXT,
    endpoint_soap TEXT DEFAULT 'https://servicos.minfin.gov.ao/ws/faturacao',
    auto_send BOOLEAN DEFAULT false,
    aes_secret_key TEXT DEFAULT 'SUACHAVESECRETA32CARACTERESAAAAA',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id)
);

CREATE TABLE IF NOT EXISTS agt_logs (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    invoice_id INTEGER,
    invoice_number TEXT,
    status TEXT CHECK (status IN ('ENVIADO', 'ERRO', 'PENDENTE', 'IGNORADO')),
    response_xml TEXT,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE agt_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agt_logs ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation Policies
DROP POLICY IF EXISTS tenant_isolation ON agt_configs;
CREATE POLICY tenant_isolation ON agt_configs FOR ALL USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'master') 
    OR 
    (company_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'company_id')::INTEGER)
);

DROP POLICY IF EXISTS tenant_isolation ON agt_logs;
CREATE POLICY tenant_isolation ON agt_logs FOR ALL USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'master') 
    OR 
    (company_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'company_id')::INTEGER)
);
