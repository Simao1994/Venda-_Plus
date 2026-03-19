-- Migration: Missing Pharmacy Tables
-- Date: 2026-03-19

-- 1. Movimentos de Stock
CREATE TABLE IF NOT EXISTS movimentos_stock_farmacia (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    medicamento_id INTEGER REFERENCES medicamentos(id) ON DELETE SET NULL,
    lote_id INTEGER REFERENCES lotes_medicamentos(id) ON DELETE SET NULL,
    quantidade REAL NOT NULL,
    tipo_movimento TEXT NOT NULL,
    motivo TEXT,
    utilizador_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    data_movimento TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Clientes Farmácia (Pacientes)
CREATE TABLE IF NOT EXISTS clientes_farmacia (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    data_nascimento DATE,
    numero_utente TEXT,
    alergias TEXT,
    historico_medicamentos TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Vendas Farmácia
CREATE TABLE IF NOT EXISTS vendas_farmacia (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    vendedor_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    cliente_id INTEGER REFERENCES clientes_farmacia(id) ON DELETE SET NULL,
    numero_factura TEXT NOT NULL,
    subtotal REAL NOT NULL,
    iva REAL NOT NULL,
    total REAL NOT NULL,
    valor_entregue REAL,
    troco REAL,
    forma_pagamento TEXT DEFAULT 'dinheiro',
    hash TEXT,
    prev_hash TEXT,
    is_certified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Itens de Venda Farmácia
CREATE TABLE IF NOT EXISTS itens_venda_farmacia (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    venda_id INTEGER NOT NULL REFERENCES vendas_farmacia(id) ON DELETE CASCADE,
    medicamento_id INTEGER REFERENCES medicamentos(id) ON DELETE SET NULL,
    lote_id INTEGER REFERENCES lotes_medicamentos(id) ON DELETE SET NULL,
    quantidade REAL NOT NULL,
    preco_unitario REAL NOT NULL,
    iva REAL NOT NULL,
    total REAL NOT NULL
);

-- 5. Receitas Médicas
CREATE TABLE IF NOT EXISTS receitas_medicas (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    paciente_nome TEXT,
    medico_nome TEXT,
    numero_ordem_medico TEXT,
    hospital TEXT,
    data_receita DATE,
    imagem_receita TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Itens de Receita Médica
CREATE TABLE IF NOT EXISTS itens_receita_medica (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    receita_id INTEGER NOT NULL REFERENCES receitas_medicas(id) ON DELETE CASCADE,
    medicamento_id INTEGER REFERENCES medicamentos(id) ON DELETE SET NULL,
    quantidade REAL NOT NULL
);

-- 7. Compras Farmácia
CREATE TABLE IF NOT EXISTS compras_farmacia (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    fornecedor_id INTEGER REFERENCES fornecedores_farmaceuticos(id) ON DELETE SET NULL,
    numero_compra TEXT NOT NULL,
    data_compra DATE NOT NULL,
    subtotal REAL NOT NULL,
    iva REAL NOT NULL,
    total REAL NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Itens de Compra Farmácia
CREATE TABLE IF NOT EXISTS itens_compra_farmacia (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    compra_id INTEGER NOT NULL REFERENCES compras_farmacia(id) ON DELETE CASCADE,
    medicamento_id INTEGER REFERENCES medicamentos(id) ON DELETE SET NULL,
    lote_id INTEGER REFERENCES lotes_medicamentos(id) ON DELETE SET NULL,
    quantidade REAL NOT NULL,
    preco_unitario REAL NOT NULL,
    total REAL NOT NULL
);

-- Enable RLS and apply Tenant Isolation Policies
DO $$ 
DECLARE 
    t TEXT;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name IN (
            'movimentos_stock_farmacia', 'clientes_farmacia', 'vendas_farmacia', 
            'itens_venda_farmacia', 'receitas_medicas', 'itens_receita_medica',
            'compras_farmacia', 'itens_compra_farmacia'
          )
    LOOP
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        
        -- Master Bypass Policy
        EXECUTE format('DROP POLICY IF EXISTS master_bypass ON %I', t);
        EXECUTE format('CREATE POLICY master_bypass ON %I FOR ALL USING ( (current_setting(''request.jwt.claims'', true)::jsonb ->> ''role'') = ''master'' )', t);

        -- Tenant Isolation Policy
        EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
        EXECUTE format('CREATE POLICY tenant_isolation ON %I FOR ALL USING (
            (current_setting(''request.jwt.claims'', true)::jsonb ->> ''role'' = ''master'') 
            OR 
            (company_id = get_auth_tenant())
            OR
            (get_auth_tenant() IS NULL)
        )', t);
    END LOOP;
END $$;
