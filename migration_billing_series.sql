-- Create billing_series table
CREATE TABLE IF NOT EXISTS billing_series (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    doc_type TEXT NOT NULL, -- 'FAC', 'PRO', 'NC', etc.
    series_name TEXT NOT NULL, -- e.g., '2026'
    last_number INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(company_id, doc_type, series_name)
);

-- Enable RLS
ALTER TABLE billing_series ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own company's billing series"
    ON billing_series FOR SELECT
    USING (auth.uid() IN (
        SELECT id FROM users WHERE company_id = billing_series.company_id
    ));

CREATE POLICY "Admins can manage their own company's billing series"
    ON billing_series FOR ALL
    USING (auth.uid() IN (
        SELECT id FROM users WHERE company_id = billing_series.company_id AND role = 'admin'
    ));

-- Add trigger for updated_at
CREATE TRIGGER set_billing_series_updated_at
    BEFORE UPDATE ON billing_series
    FOR EACH ROW
    EXECUTE FUNCTION moddatetime (updated_at);
