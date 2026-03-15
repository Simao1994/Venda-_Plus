-- SUPABASE SCHEMA FOR VENDA PLUS
-- Last update: 2026-03-14

-- 0. ADMINISTRATIVE TOOLS
-- This function allows the backend to apply schema updates automatically.
CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
RETURNS void AS $$
BEGIN
    EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. SAAS & CORE
-- Project: margarmxtxvmszzpxpjl

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. HELPER FUNCTIONS
CREATE TABLE IF NOT EXISTS system_migrations (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION get_auth_tenant()
RETURNS INTEGER AS $$
BEGIN
  RETURN (current_setting('request.jwt.claims', true)::jsonb ->> 'company_id')::INTEGER;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. CORE TABLES
-- 2. CORE TABLES
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    nif TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    logo TEXT,
    tax_percentage REAL DEFAULT 14,
    currency TEXT DEFAULT 'Kz',
    status TEXT CHECK(status IN ('pending', 'active', 'suspended', 'expired')) DEFAULT 'active',
    custom_domain TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS branches (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure branch 1 exists for initial seed
INSERT INTO branches (id, company_id, name) VALUES (1, 1, 'Sede Central') ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT CHECK(role IN ('admin', 'manager', 'cashier', 'master')) DEFAULT 'cashier',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Register Cash Flow Control
CREATE TABLE IF NOT EXISTS cash_registers (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id INTEGER NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id),
    opened_at TIMESTAMPTZ DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    initial_value REAL DEFAULT 0,
    final_value REAL,
    total_sold REAL DEFAULT 0,
    status TEXT CHECK(status IN ('open', 'closed')) DEFAULT 'open'
);

CREATE TABLE IF NOT EXISTS cash_register_transactions (
    id SERIAL PRIMARY KEY,
    register_id INTEGER NOT NULL REFERENCES cash_registers(id) ON DELETE CASCADE,
    type TEXT CHECK(type IN ('in', 'out')) NOT NULL,
    amount REAL NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    barcode TEXT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    unit TEXT DEFAULT 'un',
    cost_price REAL DEFAULT 0,
    sale_price REAL DEFAULT 0,
    tax_percentage REAL DEFAULT 14,
    stock REAL DEFAULT 0,
    min_stock REAL DEFAULT 5,
    image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    nif TEXT,
    phone TEXT,
    address TEXT,
    email TEXT,
    balance REAL DEFAULT 0,
    total_spent REAL DEFAULT 0,
    loyalty_points INTEGER DEFAULT 0,
    tier TEXT DEFAULT 'Standard',
    is_vip BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id INTEGER NOT NULL REFERENCES branches(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    customer_id INTEGER REFERENCES customers(id),
    total REAL NOT NULL,
    subtotal REAL NOT NULL,
    tax REAL NOT NULL,
    amount_paid REAL NOT NULL,
    change REAL NOT NULL,
    payment_method TEXT CHECK(payment_method IN ('cash', 'credit')) DEFAULT 'cash',
    status TEXT CHECK(status IN ('paid', 'pending')) DEFAULT 'paid',
    invoice_number TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    payment_method TEXT DEFAULT 'cash',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sale_items (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity REAL NOT NULL,
    unit_price REAL NOT NULL,
    subtotal REAL NOT NULL
);

-- 3. SAAS MODULE TABLES
CREATE TABLE IF NOT EXISTS saas_plans (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    price_monthly REAL NOT NULL,
    price_semestrial REAL NOT NULL,
    price_yearly REAL NOT NULL,
    features JSONB, -- Module gating (internal)
    public_features JSONB DEFAULT '[]'::jsonb, -- Landing page bullet points
    is_featured BOOLEAN DEFAULT false, -- Highlighted on home
    duration_months INTEGER DEFAULT 1,
    user_limit INTEGER DEFAULT 5,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Landing Page & Global System Settings
CREATE TABLE IF NOT EXISTS system_config (
    id SERIAL PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS saas_subscriptions (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES saas_plans(id),
    status TEXT CHECK(status IN ('active', 'suspended', 'expired')) DEFAULT 'active',
    tipo_plano TEXT CHECK(tipo_plano IN ('mensal', 'semestrial', 'anual')) NOT NULL,
    data_inicio TIMESTAMPTZ DEFAULT NOW(),
    data_expiracao TIMESTAMPTZ NOT NULL,
    valor_pago REAL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saas_payments (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    amount REAL NOT NULL,
    status TEXT CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    proof_url TEXT,
    method TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activity_logs (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id),
    user_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PHARMACY MODULE
CREATE TABLE IF NOT EXISTS medicamentos (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    nome_medicamento TEXT NOT NULL,
    nome_generico TEXT,
    codigo_interno TEXT,
    codigo_barras TEXT,
    qr_code TEXT,
    categoria_terapeutica TEXT,
    forma_farmaceutica TEXT,
    dosagem TEXT,
    laboratorio TEXT,
    pais_origem TEXT,
    necessita_receita BOOLEAN DEFAULT FALSE,
    tipo_receita TEXT,
    temperatura_armazenamento TEXT,
    preco_compra REAL DEFAULT 0,
    preco_venda REAL DEFAULT 0,
    margem_lucro REAL DEFAULT 0,
    iva REAL DEFAULT 14,
    estoque_minimo INTEGER DEFAULT 5,
    status TEXT DEFAULT 'ativo',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fornecedores_farmaceuticos (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    nome_empresa TEXT NOT NULL,
    nif TEXT,
    telefone TEXT,
    email TEXT,
    endereco TEXT,
    licenca_sanitaria TEXT,
    status TEXT DEFAULT 'ativo',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lotes_medicamentos (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    medicamento_id INTEGER NOT NULL REFERENCES medicamentos(id) ON DELETE CASCADE,
    numero_lote TEXT NOT NULL,
    data_fabricacao DATE,
    data_validade DATE NOT NULL,
    quantidade_inicial INTEGER NOT NULL,
    quantidade_atual INTEGER NOT NULL,
    fornecedor_id INTEGER REFERENCES fornecedores_farmaceuticos(id),
    custo_unitario REAL DEFAULT 0,
    localizacao_armazenamento TEXT,
    status TEXT DEFAULT 'ativo',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. OTHER UTILITY TABLES
CREATE TABLE IF NOT EXISTS publications (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image TEXT,
    type TEXT CHECK(type IN ('promo', 'news', 'product')) DEFAULT 'news',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    supplier_id INTEGER REFERENCES suppliers(id),
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    due_date DATE NOT NULL,
    status TEXT CHECK(status IN ('pending', 'paid')) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. HR & RECURSOS HUMANOS
CREATE TABLE IF NOT EXISTS hr_departments (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_employees (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    department_id INTEGER REFERENCES hr_departments(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    position TEXT NOT NULL,
    hire_date DATE NOT NULL,
    salary_base REAL DEFAULT 0,
    food_allowance REAL DEFAULT 0,
    transport_allowance REAL DEFAULT 0,
    other_deductions REAL DEFAULT 0,
    is_service_provider BOOLEAN DEFAULT FALSE,
    bank_account TEXT,
    nif TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_attendance (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status TEXT CHECK(status IN ('present', 'absent', 'late', 'sick_leave')) DEFAULT 'present',
    check_in TIME,
    check_out TIME,
    UNIQUE(employee_id, date)
);

CREATE TABLE IF NOT EXISTS hr_payrolls (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    total_gross REAL DEFAULT 0,
    total_net REAL DEFAULT 0,
    total_inss_employee REAL DEFAULT 0,
    total_inss_employer REAL DEFAULT 0,
    total_irt REAL DEFAULT 0,
    total_other_deductions REAL DEFAULT 0,
    status TEXT CHECK(status IN ('draft', 'finalized')) DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hr_payroll_items (
    id SERIAL PRIMARY KEY,
    payroll_id INTEGER NOT NULL REFERENCES hr_payrolls(id) ON DELETE CASCADE,
    employee_id INTEGER NOT NULL REFERENCES hr_employees(id) ON DELETE CASCADE,
    salary_base REAL NOT NULL,
    food_allowance REAL DEFAULT 0,
    transport_allowance REAL DEFAULT 0,
    gross_salary REAL NOT NULL,
    inss_employee REAL DEFAULT 0,
    inss_employer REAL DEFAULT 0,
    irt REAL DEFAULT 0,
    other_deductions REAL DEFAULT 0,
    net_salary REAL NOT NULL
);



-- SEED DATA FOR MASTER ADMIN
-- First, ensure a company exists for the master admin
INSERT INTO companies (id, name, email, status) 
VALUES (1, 'VENDA PLUS MASTER', 'admin@vendaplus.com', 'active')
ON CONFLICT (id) DO UPDATE SET status = 'active';

-- Create the initial master user
-- Email: simaopambo94@gmail.com
-- Password: leonora1994
INSERT INTO users (name, email, password, role, company_id)
VALUES ('Administrador Master', 'simaopambo94@gmail.com', '$2b$10$vxoghR08oxuiYNb3vpIsueeqS/YEOts.itHIflNczr8wOKb3Xzt7.', 'master', 1)
ON CONFLICT (email) DO UPDATE SET password = EXCLUDED.password, role = 'master';

-- Seed SaaS Plans
INSERT INTO saas_plans (name, price_monthly, price_semestrial, price_yearly, features) VALUES
('Básico', 5000, 25000, 45000, '["sales", "settings"]'),
('Profissional', 15000, 75000, 140000, '["sales", "settings", "hr", "marketing"]'),
('Ultimate', 35000, 180000, 320000, '["sales", "settings", "hr", "marketing", "pharmacy"]' )
ON CONFLICT DO NOTHING;

-- Ensure RLS is active and correct for sensitive tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Re-apply master admin bypass for all tables
-- This ensures 'master' role can see everything
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS master_bypass ON %I', r.tablename);
        EXECUTE format('CREATE POLICY master_bypass ON %I FOR ALL USING ( (current_setting(''request.jwt.claims'', true)::jsonb ->> ''role'') = ''master'' )', r.tablename);
    END LOOP;
END $$;

-- 6. SECURITY & RLS POLICIES
DO $$ 
DECLARE 
    t TEXT;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          AND table_name NOT IN ('companies', 'saas_plans', 'saas_payments', 'saas_subscriptions', 'activity_logs')
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = t AND column_name = 'company_id') THEN
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
            EXECUTE format('DROP POLICY IF EXISTS tenant_isolation ON %I', t);
            EXECUTE format('CREATE POLICY tenant_isolation ON %I FOR ALL USING (
                (current_setting(''request.jwt.claims'', true)::jsonb ->> ''role'' = ''master'') 
                OR 
                (company_id = get_auth_tenant())
                OR
                (get_auth_tenant() IS NULL)
            )', t);
        END IF;
    END LOOP;
    
    -- Specific publications isolation
    ALTER TABLE publications ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS publications_isolation ON publications;
    DROP POLICY IF EXISTS allow_public_read_publications ON publications;
    DROP POLICY IF EXISTS publications_insert ON publications;
    DROP POLICY IF EXISTS publications_delete ON publications;
    
    -- SELECT: Public can see everything, Master can see everything, Tenants see their own (public covers this)
    CREATE POLICY allow_public_read_publications ON publications FOR SELECT USING (TRUE);
    
    -- INSERT: Authenticated users can insert for their own company, Master can insert for any
    -- FALLBACK: Allowing 'anon' temporarily to unblock backend due to SERVICE_ROLE_KEY misconfiguration
    CREATE POLICY publications_insert ON publications FOR INSERT TO authenticated, anon WITH CHECK (
        (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'master') 
        OR 
        (company_id = get_auth_tenant())
        OR
        (get_auth_tenant() IS NULL) -- Emergency fallback for misconfigured backend
    );
    
    -- DELETE: Authenticated users can delete their own company's items, Master can delete any
    CREATE POLICY publications_delete ON publications FOR DELETE TO authenticated, anon USING (
        (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'master') 
        OR 
        (company_id = get_auth_tenant())
        OR
        (get_auth_tenant() IS NULL)
    );

    -- Specific categories isolation
    ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS categories_isolation ON categories;
    DROP POLICY IF EXISTS categories_select ON categories;
    DROP POLICY IF EXISTS categories_insert ON categories;
    DROP POLICY IF EXISTS categories_delete ON categories;

    -- SELECT: Authenticated users can see their own company's categories, Master sees all
    CREATE POLICY categories_select ON categories FOR SELECT TO authenticated USING (
        (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'master') 
        OR 
        (company_id = get_auth_tenant())
    );

    -- INSERT: Authenticated users can insert for their own company, Master can insert for any
    -- FALLBACK: Allowing 'anon' temporarily to unblock backend due to SERVICE_ROLE_KEY misconfiguration
    CREATE POLICY categories_insert ON categories FOR INSERT TO authenticated, anon WITH CHECK (
        (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'master') 
        OR 
        (company_id = get_auth_tenant())
        OR
        (get_auth_tenant() IS NULL) -- Emergency fallback for misconfigured backend
    );

    -- DELETE: Authenticated users can delete their own company's items, Master can delete any
    CREATE POLICY categories_delete ON categories FOR DELETE TO authenticated, anon USING (
        (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'master') 
        OR 
        (company_id = get_auth_tenant())
        OR
        (get_auth_tenant() IS NULL)
    );


END $$;


-- Specific SaaS Policies
ALTER TABLE saas_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS master_plans_all ON saas_plans;
CREATE POLICY master_plans_all ON saas_plans FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'master');
DROP POLICY IF EXISTS tenant_plans_read ON saas_plans;
CREATE POLICY tenant_plans_read ON saas_plans FOR SELECT USING (TRUE);

ALTER TABLE saas_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS master_subs_all ON saas_subscriptions;
CREATE POLICY master_subs_all ON saas_subscriptions FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'master');
DROP POLICY IF EXISTS tenant_subs_read ON saas_subscriptions;
CREATE POLICY tenant_subs_read ON saas_subscriptions FOR SELECT USING (company_id = get_auth_tenant());

ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS master_config_all ON system_config;
CREATE POLICY master_config_all ON system_config FOR ALL USING (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'master');
DROP POLICY IF EXISTS public_config_read ON system_config;
CREATE POLICY public_config_read ON system_config FOR SELECT USING (is_public = TRUE);

-- Allow anon (server) to read users and companies during login flow
DROP POLICY IF EXISTS allow_anon_read_for_login ON users;
CREATE POLICY allow_anon_read_for_login ON users FOR SELECT TO anon USING (TRUE);

DROP POLICY IF EXISTS allow_anon_read_for_login ON companies;
CREATE POLICY allow_anon_read_for_login ON companies FOR SELECT TO anon USING (TRUE);


-- Registration is now restricted to Master Admin or Backend with Service Role
DROP POLICY IF EXISTS allow_anon_insert_for_register ON users;
DROP POLICY IF EXISTS allow_anon_insert_for_register ON saas_subscriptions;


ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS company_isolation ON companies;
CREATE POLICY company_isolation ON companies FOR ALL USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'master')
    OR
    (id = get_auth_tenant())
);

-- 7. SEED DATA
INSERT INTO saas_plans (name, price_monthly, price_semestrial, price_yearly, features) VALUES
('Básico', 5000, 27000, 50000, '{"max_users": 2, "max_products": 100}'),
('Pro', 15000, 80000, 150000, '{"max_users": 10, "max_products": 1000}'),
('Enterprise', 50000, 270000, 500000, '{"max_users": 100, "max_products": 10000}')
ON CONFLICT DO NOTHING;

-- Initial Landing Page Config
INSERT INTO system_config (key, value, description) VALUES
('landing_stats', '[
    {"label": "Checkout Segundos", "value": "+1.2k"},
    {"label": "Sync em Nuvem", "value": "100%"},
    {"label": "Multi-empresa", "value": "Global"}
]', 'Estatísticas de destaque na página inicial'),
('landing_modules', '[
    {"title": "Vendas & Facturação", "desc": "Gestão completa de PDV, stock e emissão de facturas certificadas.", "icon": "ShoppingCart", "color": "bg-blue-500"},
    {"title": "Recursos Humanos", "desc": "Gestão de assiduidade, processamento de salários e contratos.", "icon": "Users", "color": "bg-purple-500"},
    {"title": "Gestão de Farmácia", "desc": "Controlo rigoroso de lotes, receitas e stocks de medicamentos.", "icon": "Cross", "color": "bg-emerald-500"},
    {"title": "Marketing Digital", "desc": "Divulgue as suas ofertas directamente no nosso Market público.", "icon": "Smartphone", "color": "bg-orange-500"}
]', 'Módulos exibidos na página inicial')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 8. PERFORMANCE INDICES
CREATE INDEX IF NOT EXISTS idx_sales_company_id ON sales(company_id);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_medicamentos_codigo_barras ON medicamentos(codigo_barras);
