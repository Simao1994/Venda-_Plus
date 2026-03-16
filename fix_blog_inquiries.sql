-- Migration to add Public Inquiries/Contact feature for the Corporate Blog
CREATE TABLE IF NOT EXISTS public_inquiries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    assunto TEXT,
    mensagem TEXT NOT NULL,
    status TEXT DEFAULT 'pendente', -- pendente, respondida, arquivada
    data_envio TIMESTAMPTZ DEFAULT NOW(),
    resposta TEXT,
    data_resposta TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public_inquiries ENABLE ROW LEVEL SECURITY;

-- 1. Public can INSERT
DROP POLICY IF EXISTS public_insert_inquiries ON public_inquiries;
CREATE POLICY public_insert_inquiries ON public_inquiries FOR INSERT WITH CHECK (true);

-- 2. Tenant Isolation (Companies can see their own inquiries)
DROP POLICY IF EXISTS tenant_isolation ON public_inquiries;
CREATE POLICY tenant_isolation ON public_inquiries FOR ALL USING (
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'master') 
    OR 
    (company_id = get_auth_tenant())
);

-- 3. Master Bypass
DROP POLICY IF EXISTS master_bypass ON public_inquiries;
CREATE POLICY master_bypass ON public_inquiries FOR ALL USING ( (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'master' );
