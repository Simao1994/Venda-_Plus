-- Migration: Create System Documentation Table
CREATE TABLE IF NOT EXISTS system_documentation (
    id TEXT PRIMARY KEY, -- Using the 'id' from JSON as primary key
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    training_steps JSONB DEFAULT '[]',
    keywords JSONB DEFAULT '[]',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE system_documentation ENABLE ROW LEVEL SECURITY;

-- Policies: Everyone can read
DROP POLICY IF EXISTS system_docs_read ON system_documentation;
CREATE POLICY system_docs_read ON system_documentation
    FOR SELECT TO authenticated
    USING (true);

-- Policies: Only Admins/Masters can edit
DROP POLICY IF EXISTS system_docs_manage ON system_documentation;
CREATE POLICY system_docs_manage ON system_documentation
    FOR ALL TO authenticated
    USING (
        (current_setting('request.jwt.claims', true)::jsonb ->> 'role') IN ('admin', 'master')
    );

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS set_system_documentation_updated_at ON system_documentation;
CREATE TRIGGER set_system_documentation_updated_at
    BEFORE UPDATE ON system_documentation
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime (updated_at);
