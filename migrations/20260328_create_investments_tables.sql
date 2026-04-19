-- Adicionar colunas à tabela investidores (se não existirem)
ALTER TABLE investidores ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE investidores ADD COLUMN IF NOT EXISTS telefone_alternativo TEXT;
ALTER TABLE investidores ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE investidores ADD COLUMN IF NOT EXISTS morada TEXT;
ALTER TABLE investidores ADD COLUMN IF NOT EXISTS naturalidade TEXT;
ALTER TABLE investidores ADD COLUMN IF NOT EXISTS provincia TEXT;
ALTER TABLE investidores ADD COLUMN IF NOT EXISTS data_emissao TEXT;
ALTER TABLE investidores ADD COLUMN IF NOT EXISTS data_validade TEXT;
ALTER TABLE investidores ADD COLUMN IF NOT EXISTS escolaridade TEXT;
ALTER TABLE investidores ADD COLUMN IF NOT EXISTS curso TEXT;
ALTER TABLE investidores ADD COLUMN IF NOT EXISTS profissao TEXT;
ALTER TABLE investidores ADD COLUMN IF NOT EXISTS foto TEXT;
ALTER TABLE investidores ADD COLUMN IF NOT EXISTS tipo_investidor TEXT;
ALTER TABLE investidores ADD COLUMN IF NOT EXISTS banco_principal TEXT;
ALTER TABLE investidores ADD COLUMN IF NOT EXISTS iban_principal TEXT;
ALTER TABLE investidores ADD COLUMN IF NOT EXISTS banco_alternativo TEXT;
ALTER TABLE investidores ADD COLUMN IF NOT EXISTS iban_alternativo TEXT;

-- Tabela de Investimentos
CREATE TABLE IF NOT EXISTS investimentos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    investidor_id TEXT NOT NULL,
    titulo TEXT NOT NULL,
    capital_inicial DOUBLE PRECISION NOT NULL,
    data_inicio TEXT NOT NULL,
    data_fim TEXT,
    contrato_url TEXT,
    regime TEXT,
    taxa TEXT,
    duracao TEXT,
    periodicidade TEXT,
    status TEXT DEFAULT 'Ativo',
    company_id INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de Registos de Investimento
CREATE TABLE IF NOT EXISTS investment_records (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    investimento_id TEXT NOT NULL,
    data TEXT NOT NULL,
    aumento DOUBLE PRECISION DEFAULT 0,
    juros DOUBLE PRECISION DEFAULT 0,
    iac DOUBLE PRECISION DEFAULT 0,
    saque DOUBLE PRECISION DEFAULT 0,
    multa DOUBLE PRECISION DEFAULT 0,
    observacoes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inserir investidor de teste (apenas se não existir)
INSERT INTO investidores (nome, nif, email, password, telefone, company_id)
SELECT 'Simão Pambo Puca', '003254125LA044', 'simao@investidor', '123', '+244 923 000 000', 1
WHERE NOT EXISTS (SELECT 1 FROM investidores WHERE email = 'simao@investidor');
