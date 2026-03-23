-- Migration: SAF-T (AOA) XML Generation Logs

-- Regista o histórico de ficheiros SAF-T gerados para auditoria e rastreabilidade

CREATE TABLE IF NOT EXISTS saft_generation_logs (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    fiscal_year INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    filename TEXT NOT NULL,
    total_invoices INTEGER DEFAULT 0,
    total_payments INTEGER DEFAULT 0,
    total_gross_value REAL DEFAULT 0,
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para consulta rápida por empresa
CREATE INDEX IF NOT EXISTS idx_saft_logs_company_id ON saft_generation_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_saft_logs_fiscal_year ON saft_generation_logs(company_id, fiscal_year);

-- RLS: Isolamento por empresa
ALTER TABLE saft_generation_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS saft_logs_tenant_isolation ON saft_generation_logs;
CREATE POLICY saft_logs_tenant_isolation ON saft_generation_logs FOR ALL USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'master')
    OR
    (company_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'company_id')::INTEGER)
);
