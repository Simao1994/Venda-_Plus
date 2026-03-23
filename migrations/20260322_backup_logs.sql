-- Migration: AGT Backup Logging
-- AGT Compliance: Systems must log that backups are being performed regularly.

CREATE TABLE IF NOT EXISTS backup_logs (
    id SERIAL PRIMARY KEY,
    company_id INTEGER REFERENCES companies(id), -- Null for system-wide backups
    backup_type TEXT CHECK(backup_type IN ('automatic', 'manual')) DEFAULT 'automatic',
    status TEXT CHECK(status IN ('success', 'failed')) DEFAULT 'success',
    file_name TEXT,
    file_size_bytes BIGINT,
    storage_provider TEXT DEFAULT 'Supabase/PostgreSQL',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comentário para auditoria
COMMENT ON TABLE backup_logs IS 'Log de cópias de segurança exigido pela AGT para auditoria de integridade de dados.';
