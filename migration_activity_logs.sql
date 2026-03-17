-- Migration: Create Activity Logs table for Audit
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_name TEXT, -- Snapshot of user name at the time of action
    action TEXT NOT NULL, -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', etc.
    resource TEXT NOT NULL, -- 'SALE', 'PRODUCT', 'CUSTOMER', 'USER', etc.
    description TEXT, -- Human readable description
    metadata JSONB DEFAULT '{}', -- Store old/new values or extra context
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Only Admins/Managers can see logs for their company
DROP POLICY IF EXISTS activity_logs_select ON activity_logs;
CREATE POLICY activity_logs_select ON activity_logs 
FOR SELECT TO authenticated 
USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role' IN ('admin', 'manager', 'master'))
    AND
    (
        (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'master')
        OR
        (company_id = (current_setting('request.jwt.claims', true)::jsonb ->> 'company_id')::INTEGER)
    )
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_activity_logs_company_id ON activity_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
