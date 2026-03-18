-- ============================================
-- INTEGRAÇÃO AUTOMÁTICA: VENDAS → CONTABILIDADE
-- ============================================

-- 1. FUNÇÃO PARA GARANTIR PERÍODO CONTÁBIL
CREATE OR REPLACE FUNCTION get_or_create_periodo(p_company_id INTEGER, p_date DATE)
RETURNS UUID AS $$
DECLARE
    v_mes INTEGER := EXTRACT(MONTH FROM p_date);
    v_ano INTEGER := EXTRACT(YEAR FROM p_date);
    v_periodo_id UUID;
BEGIN
    SELECT id INTO v_periodo_id 
    FROM public.contabil_periodos 
    WHERE company_id = p_company_id AND mes = v_mes AND ano = v_ano;

    IF v_periodo_id IS NULL THEN
        INSERT INTO public.contabil_periodos (company_id, mes, ano, status)
        VALUES (p_company_id, v_mes, v_ano, 'Aberto')
        RETURNING id INTO v_periodo_id;
    END IF;

    RETURN v_periodo_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. FUNÇÃO PRINCIPAL DE LANÇAMENTO
CREATE OR REPLACE FUNCTION trg_auto_post_sale_to_accounting()
RETURNS TRIGGER AS $$
DECLARE
    v_periodo_id UUID;
    v_lancamento_id UUID;
    v_conta_caixa_id UUID;
    v_conta_vendas_id UUID;
    v_conta_iva_id UUID;
    v_conta_caixa_nome TEXT;
    v_conta_vendas_nome TEXT;
    v_conta_iva_nome TEXT;
BEGIN
    -- Obter/Criar período
    v_periodo_id := get_or_create_periodo(NEW.company_id, NEW.created_at::DATE);

    -- Buscar contas padrão (PGC Angola)
    -- 11: Caixa
    -- 71: Vendas
    -- 243: IVA
    SELECT id, nome INTO v_conta_caixa_id, v_conta_caixa_nome FROM public.contabil_plano_contas WHERE company_id = NEW.company_id AND (codigo = '11' OR (codigo LIKE '11.%' AND nivel = 2)) LIMIT 1;
    SELECT id, nome INTO v_conta_vendas_id, v_conta_vendas_nome FROM public.contabil_plano_contas WHERE company_id = NEW.company_id AND (codigo = '71' OR (codigo LIKE '71.%' AND nivel = 2)) LIMIT 1;
    SELECT id, nome INTO v_conta_iva_id, v_conta_iva_nome FROM public.contabil_plano_contas WHERE company_id = NEW.company_id AND (codigo = '243' OR (codigo LIKE '243.%' AND nivel = 2)) LIMIT 1;

    -- Se não encontrar as contas via código exacto, tentaremos via nome ou criaríamos, 
    -- mas por agora vamos exigir que existam ou usar fallback básico
    IF v_conta_caixa_id IS NULL OR v_conta_vendas_id IS NULL THEN
        -- Logar erro ou ignorar se for rascunho. Mas para AGT o ideal é lançar excepção se o sistema estiver em produção
        RETURN NEW; 
    END IF;

    -- Criar Cabeçalho do Lançamento
    INSERT INTO public.contabil_lancamentos (
        company_id,
        periodo_id,
        data,
        descricao,
        status,
        tipo_transacao
    ) VALUES (
        NEW.company_id,
        v_periodo_id,
        NEW.created_at::DATE,
        'Integração Automática - Venda ' || NEW.invoice_number,
        'Validado',
        'Venda'
    ) RETURNING id INTO v_lancamento_id;

    -- 1. DÉBITO: Caixa (Total Pago)
    INSERT INTO public.contabil_lancamento_itens (
        company_id, lancamento_id, conta_codigo, conta_nome, tipo, valor
    ) VALUES (
        NEW.company_id, v_lancamento_id, '11', v_conta_caixa_nome, 'D', NEW.total
    );

    -- 2. CRÉDITO: Vendas (Subtotal sem IVA)
    INSERT INTO public.contabil_lancamento_itens (
        company_id, lancamento_id, conta_codigo, conta_nome, tipo, valor
    ) VALUES (
        NEW.company_id, v_lancamento_id, '71', v_conta_vendas_nome, 'C', NEW.subtotal
    );

    -- 3. CRÉDITO: IVA Liquidado (Valor do Imposto)
    IF NEW.tax > 0 THEN
        INSERT INTO public.contabil_lancamento_itens (
            company_id, lancamento_id, conta_codigo, conta_nome, tipo, valor
        ) VALUES (
            NEW.company_id, v_lancamento_id, '243', COALESCE(v_conta_iva_nome, 'Estado - IVA'), 'C', NEW.tax
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CRIAR TRIGGER
DROP TRIGGER IF EXISTS trigger_auto_accounting_sales ON public.sales;
CREATE TRIGGER trigger_auto_accounting_sales
AFTER INSERT OR UPDATE ON public.sales
FOR EACH ROW
WHEN (NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status != 'paid'))
EXECUTE FUNCTION trg_auto_post_sale_to_accounting();

-- 4. GARANTIR CONTAS BÁSICAS PARA TODAS AS EMPRESAS ATUAIS
DO $$ 
DECLARE 
    comp RECORD;
BEGIN
    FOR comp IN SELECT id FROM public.companies LOOP
        -- Caixa
        INSERT INTO public.contabil_plano_contas (company_id, codigo, nome, tipo, e_analitica)
        VALUES (comp.id, '11', 'Caixa Geral', 'Ativo', TRUE)
        ON CONFLICT (company_id, codigo) DO NOTHING;

        -- Vendas
        INSERT INTO public.contabil_plano_contas (company_id, codigo, nome, tipo, e_analitica)
        VALUES (comp.id, '71', 'Vendas de Mercadorias', 'Proveito', TRUE)
        ON CONFLICT (company_id, codigo) DO NOTHING;

        -- IVA
        INSERT INTO public.contabil_plano_contas (company_id, codigo, nome, tipo, e_analitica)
        VALUES (comp.id, '243', 'IVA Liquidado', 'Passivo', TRUE)
        ON CONFLICT (company_id, codigo) DO NOTHING;
    END LOOP;
END $$;
