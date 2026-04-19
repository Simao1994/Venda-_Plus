-- Adicionar colunas faltantes na tabela de lançamentos de investimentos
-- Garantir que as tabelas usadas pelo servidor tenham as colunas necessárias

DO $$ 
BEGIN
    -- Verificar e atualizar a tabela 'investimentos_lancamentos' (usada no server.ts)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'investimentos_lancamentos') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'investimentos_lancamentos' AND column_name = 'comissao') THEN
            ALTER TABLE investimentos_lancamentos ADD COLUMN comissao DOUBLE PRECISION DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'investimentos_lancamentos' AND column_name = 'iac') THEN
            ALTER TABLE investimentos_lancamentos ADD COLUMN iac DOUBLE PRECISION DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'investimentos_lancamentos' AND column_name = 'company_id') THEN
            ALTER TABLE investimentos_lancamentos ADD COLUMN company_id INTEGER;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'investimentos_lancamentos' AND column_name = 'investidor_id') THEN
            ALTER TABLE investimentos_lancamentos ADD COLUMN investidor_id TEXT;
        END IF;
    END IF;

    -- Para 'investment_records' (nome alternativo)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'investment_records') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'investment_records' AND column_name = 'comissao') THEN
            ALTER TABLE investment_records ADD COLUMN comissao DOUBLE PRECISION DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'investment_records' AND column_name = 'investidor_id') THEN
            ALTER TABLE investment_records ADD COLUMN investidor_id TEXT;
        END IF;
    END IF;

    -- PREENCHIMENTO RETROATIVO (BACKFILL) DO investidor_id PARA PERFORMANCE
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'investimentos_lancamentos') THEN
        UPDATE investimentos_lancamentos il
        SET investidor_id = i.investidor_id
        FROM investimentos i
        WHERE il.investimento_id = i.id
          AND il.investidor_id IS NULL;
    END IF;
END $$;

-- ÍNDICES DE PERFORMANCE PARA PORTAL DO INVESTIDOR
CREATE INDEX IF NOT EXISTS idx_investimentos_investidor_id ON investimentos(investidor_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_investimento_id ON investimentos_lancamentos(investimento_id);

NOTIFY pgrst, 'reload schema';
