-- Criar tabela empresas (entidades afiliadas para a contabilidade)
-- Cada registo representa uma empresa/entidade dentro de um tenant (company_id)
CREATE TABLE IF NOT EXISTS empresas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    nif TEXT,
    setor TEXT DEFAULT 'Comércio Geral',
    localizacao TEXT DEFAULT 'Angola',
    responsavel TEXT DEFAULT 'Administrador',
    email TEXT,
    telefone TEXT,
    moeda TEXT DEFAULT 'AOA',
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_isolation ON empresas;
CREATE POLICY tenant_isolation ON empresas FOR ALL USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'master')
    OR
    (company_id = get_auth_tenant())
    OR
    (get_auth_tenant() IS NULL)
);

DROP POLICY IF EXISTS master_bypass ON empresas;
CREATE POLICY master_bypass ON empresas FOR ALL USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'master'
);

-- Seed automático: criar uma entrada em "empresas" para cada empresa já existente em "companies"
-- Se o utilizador tem company_id = X, vai ver a sua empresa aqui
INSERT INTO empresas (company_id, nome, nif, setor, localizacao, responsavel)
SELECT 
    c.id AS company_id,
    c.name AS nome,
    COALESCE(c.nif, 'N/D') AS nif,
    'Comércio Geral' AS setor,
    'Angola' AS localizacao,
    'Administrador' AS responsavel
FROM companies c
ON CONFLICT DO NOTHING;
