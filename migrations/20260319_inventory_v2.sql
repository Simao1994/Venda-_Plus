-- 1. Add expiry_date to products (Sales)
ALTER TABLE products ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- 2. Inventory Sessions (Sales)
CREATE TABLE IF NOT EXISTS inventory_sessions (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id INTEGER REFERENCES branches(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    status TEXT CHECK(status IN ('draft', 'completed', 'cancelled')) DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS inventory_session_items (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES inventory_sessions(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    expected_quantity REAL NOT NULL,
    counted_quantity REAL,
    difference REAL,
    cost_price REAL
);

-- 3. Pharmacy Inventory Sessions (By Batch/Lote)
CREATE TABLE IF NOT EXISTS pharmacy_inventory_sessions (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    branch_id INTEGER REFERENCES branches(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    status TEXT CHECK(status IN ('draft', 'completed', 'cancelled')) DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    notes TEXT
);

CREATE TABLE IF NOT EXISTS pharmacy_inventory_session_items (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES pharmacy_inventory_sessions(id) ON DELETE CASCADE,
    lote_id INTEGER NOT NULL REFERENCES lotes_medicamentos(id),
    expected_quantity REAL NOT NULL,
    counted_quantity REAL,
    difference REAL
);

-- 4. Enable RLS
ALTER TABLE inventory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_session_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_inventory_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pharmacy_inventory_session_items ENABLE ROW LEVEL SECURITY;

-- 5. Policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their company''s sessions') THEN
        CREATE POLICY "Users can view their company's sessions" ON inventory_sessions
            FOR SELECT USING (company_id = get_auth_tenant());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage their company''s sessions') THEN
        CREATE POLICY "Admins can manage their company's sessions" ON inventory_sessions
            FOR ALL USING (company_id = get_auth_tenant());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their company''s session items') THEN
        CREATE POLICY "Users can view their company's session items" ON inventory_session_items
            FOR SELECT USING (EXISTS (SELECT 1 FROM inventory_sessions WHERE id = session_id AND company_id = get_auth_tenant()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage their company''s session items') THEN
        CREATE POLICY "Admins can manage their company's session items" ON inventory_session_items
            FOR ALL USING (EXISTS (SELECT 1 FROM inventory_sessions WHERE id = session_id AND company_id = get_auth_tenant()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their pharmacy sessions') THEN
        CREATE POLICY "Users can view their pharmacy sessions" ON pharmacy_inventory_sessions
            FOR SELECT USING (company_id = get_auth_tenant());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage their pharmacy sessions') THEN
        CREATE POLICY "Admins can manage their pharmacy sessions" ON pharmacy_inventory_sessions
            FOR ALL USING (company_id = get_auth_tenant());
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their pharmacy session items') THEN
        CREATE POLICY "Users can view their pharmacy session items" ON pharmacy_inventory_session_items
            FOR SELECT USING (EXISTS (SELECT 1 FROM pharmacy_inventory_sessions WHERE id = session_id AND company_id = get_auth_tenant()));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage their pharmacy session items') THEN
        CREATE POLICY "Admins can manage their pharmacy session items" ON pharmacy_inventory_session_items
            FOR ALL USING (EXISTS (SELECT 1 FROM pharmacy_inventory_sessions WHERE id = session_id AND company_id = get_auth_tenant()));
    END IF;
END $$;
