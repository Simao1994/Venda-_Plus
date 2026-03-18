-- focused migration for vacancies and candidates
CREATE TABLE IF NOT EXISTS rh_vagas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    descricao TEXT,
    requisitos TEXT,
    responsabilidades TEXT,
    localizacao TEXT,
    tipo_contrato TEXT,
    nivel_experiencia TEXT,
    salario TEXT,
    status TEXT DEFAULT 'ativa',
    quantidade INTEGER DEFAULT 1,
    data_publicacao TIMESTAMPTZ DEFAULT NOW(),
    data_encerramento DATE,
    criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rh_candidaturas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    vaga_id UUID REFERENCES rh_vagas(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    linkedin TEXT,
    portfolio TEXT,
    cv_url TEXT,
    mensagem TEXT,
    status TEXT DEFAULT 'pendente',
    data_envio TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE rh_vagas ENABLE ROW LEVEL SECURITY;
ALTER TABLE rh_candidaturas ENABLE ROW LEVEL SECURITY;

-- Vacancies Policies
-- SELECT: Public can see active vacancies
DROP POLICY IF EXISTS allow_public_read_vagas ON rh_vagas;
CREATE POLICY allow_public_read_vagas ON rh_vagas FOR SELECT USING (status = 'ativa');

-- ALL: Master and Company members can manage
DROP POLICY IF EXISTS tenant_isolation_vagas ON rh_vagas;
CREATE POLICY tenant_isolation_vagas ON rh_vagas FOR ALL USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'master') 
    OR 
    (company_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'company_id')::INTEGER)
);

-- Candidates Policies
-- ALL: Master and Company members can see candidates
DROP POLICY IF EXISTS tenant_isolation_candidaturas ON rh_candidaturas;
CREATE POLICY tenant_isolation_candidaturas ON rh_candidaturas FOR ALL USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'master') 
    OR 
    (company_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'company_id')::INTEGER)
);

-- INSERT: Public can apply to vacancies
DROP POLICY IF EXISTS allow_public_insert_candidatura ON rh_candidaturas;
CREATE POLICY allow_public_insert_candidatura ON rh_candidaturas FOR INSERT WITH CHECK (TRUE);
