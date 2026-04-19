-- NORMALIZAÇÃO DE DADOS PARA LOGIN DO INVESTIDOR
-- Execute este script no Dashboard do Supabase (SQL Editor)

-- 1. Garantir que o status está no formato esperado pela query de login ('Ativo')
UPDATE investidores 
SET status = 'Ativo' 
WHERE status IS NULL 
   OR status = '' 
   OR lower(status) = 'ativo';

-- 2. Garantir que o company_id está preenchido para satisfazer o Tenant Isolation
UPDATE investidores 
SET company_id = 1 
WHERE company_id IS NULL;

-- 3. Limpeza de NIFs (remover espaços em branco que podem causar falhas no login)
UPDATE investidores 
SET nif = trim(nif)
WHERE nif IS NOT NULL AND nif != trim(nif);

COMMENT ON TABLE investidores IS 'Tabela de investidores normalizada para garantir login e persistência v.2026';
