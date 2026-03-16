
CREATE TABLE IF NOT EXISTS rh_contas_bancarias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    funcionario_id INTEGER REFERENCES hr_employees(id) ON DELETE CASCADE,
    nome_banco TEXT NOT NULL,
    numero_conta TEXT NOT NULL,
    iban TEXT,
    swift_bic TEXT,
    tipo_conta TEXT DEFAULT 'Ordem',
    moeda TEXT DEFAULT 'AOA',
    titular_conta TEXT,
    pais_banco TEXT DEFAULT 'Angola',
    codigo_banco TEXT,
    codigo_agencia TEXT,
    principal BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'ativo',
    observacoes TEXT,
    criado_em TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE rh_contas_bancarias ENABLE ROW LEVEL SECURITY;

-- Tenant Isolation
DROP POLICY IF EXISTS tenant_isolation ON rh_contas_bancarias;
CREATE POLICY tenant_isolation ON rh_contas_bancarias FOR ALL USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'master') 
    OR 
    (company_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'company_id')::INTEGER)
    OR
    ((current_setting('request.jwt.claims', true)::jsonb ->> 'company_id') IS NULL)
);

-- Master Admin Bypass
DROP POLICY IF EXISTS master_bypass ON rh_contas_bancarias;
CREATE POLICY master_bypass ON rh_contas_bancarias FOR ALL USING ( (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'master' );
