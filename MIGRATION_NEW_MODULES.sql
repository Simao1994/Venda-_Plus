-- Migration for Blog, HR (Vagas, Candidaturas, Contas Bancárias) and Accounting modules
-- Using company_id (INTEGER) for tenancy alignment

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. BLOG MODULE
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    categoria TEXT,
    conteudo TEXT,
    autor TEXT,
    data DATE DEFAULT CURRENT_DATE,
    imagem_url TEXT,
    video_url TEXT,
    galeria_urls TEXT[],
    tipo TEXT DEFAULT 'artigo',
    is_publico BOOLEAN DEFAULT TRUE,
    visualizacoes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. RECRUITMENT (HR)
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

-- 3. BANK ACCOUNTS (HR)
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

-- 4. ACCOUNTING MODULE
CREATE TABLE IF NOT EXISTS contabil_plano_contas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    codigo TEXT NOT NULL,
    nome TEXT NOT NULL,
    tipo TEXT,
    natureza TEXT,
    nivel INTEGER,
    pai_id UUID REFERENCES contabil_plano_contas(id),
    e_sintetica BOOLEAN DEFAULT FALSE,
    aceita_lancamentos BOOLEAN DEFAULT TRUE,
    e_analitica BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, codigo)
);

CREATE TABLE IF NOT EXISTS contabil_periodos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    ano INTEGER NOT NULL,
    mes INTEGER NOT NULL,
    status TEXT DEFAULT 'Aberto',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(company_id, ano, mes)
);

CREATE TABLE IF NOT EXISTS contabil_lancamentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    periodo_id UUID REFERENCES contabil_periodos(id),
    data DATE NOT NULL,
    mes_referencia TEXT,
    ano_referencia INTEGER,
    descricao TEXT NOT NULL,
    usuario_id INTEGER REFERENCES users(id),
    usuario_name TEXT,
    status TEXT DEFAULT 'Pendente',
    tipo_transacao TEXT DEFAULT 'Manual',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contabil_lancamento_itens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    lancamento_id UUID REFERENCES contabil_lancamentos(id) ON DELETE CASCADE,
    conta_codigo TEXT NOT NULL,
    conta_nome TEXT NOT NULL,
    tipo CHAR(1) CHECK (tipo IN ('D', 'C')),
    valor DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data sources for Accounting Dashboard
CREATE TABLE IF NOT EXISTS contabil_faturas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    numero_fatura TEXT,
    cliente_nome TEXT,
    valor_total DECIMAL(15,2),
    status TEXT,
    data_emissao DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fin_transacoes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    descricao TEXT,
    categoria TEXT,
    valor DECIMAL(15,2),
    tipo TEXT,
    data DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_recibos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    funcionario_id INTEGER REFERENCES hr_employees(id),
    mes INTEGER,
    ano INTEGER,
    bruto DECIMAL(15,2),
    liquido DECIMAL(15,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    quantidade_atual DECIMAL(15,2) DEFAULT 0,
    quantidade_minima DECIMAL(15,2) DEFAULT 0,
    preco_unitario DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_movimentos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    entidade TEXT,
    referencia TEXT,
    quantidade DECIMAL(15,2),
    tipo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS and apply policies
DO $$ 
DECLARE 
    t TEXT;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN (
            'blog_posts', 'rh_vagas', 'rh_candidaturas', 'rh_contas_bancarias',
            'contabil_plano_contas', 'contabil_periodos', 'contabil_lancamentos',
            'contabil_lancamento_itens', 'contabil_faturas', 'fin_transacoes',
            'hr_recibos', 'inventario', 'stock_movimentos'
          )
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        
        -- Tenant Isolation
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
        EXECUTE format('CREATE POLICY tenant_isolation ON %I FOR ALL USING (
            (current_setting(''request.jwt.claims'', true)::jsonb ->> ''role'' = ''master'') 
            OR 
            (company_id = get_auth_tenant())
            OR
            (get_auth_tenant() IS NULL)
        )', t);
        
        -- Master Admin Bypass
        EXECUTE format('DROP POLICY IF EXISTS master_bypass ON %I', t);
        EXECUTE format('CREATE POLICY master_bypass ON %I FOR ALL USING ( (current_setting(''request.jwt.claims'', true)::jsonb ->> ''role'') = ''master'' )', t);
    END LOOP;
END $$;
