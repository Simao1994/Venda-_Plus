-- Migration: Add File Management Module (v2 - Fixed Permissions)
-- Date: 2026-03-21

-- Create company_files table
CREATE TABLE IF NOT EXISTS company_files (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Contratos', 'Faturas', 'RH', 'Farmácia', 'Outros')),
    size_bytes BIGINT DEFAULT 0,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE company_files ENABLE ROW LEVEL SECURITY;

-- Master Admin Bypass
DROP POLICY IF EXISTS master_bypass ON company_files;
CREATE POLICY master_bypass ON company_files FOR ALL USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'master'
);

-- Tenant Isolation
DROP POLICY IF EXISTS tenant_isolation ON company_files;
CREATE POLICY tenant_isolation ON company_files FOR ALL USING (
    company_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'company_id')::INTEGER
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_company_files_company_id ON company_files(company_id);
CREATE INDEX IF NOT EXISTS idx_company_files_category ON company_files(category);
