-- 1. Adicionar coluna password na tabela investidores
ALTER TABLE investidores ADD COLUMN IF NOT EXISTS password TEXT;

-- 2. Verificar se o investidor existe e atualizar ou inserir
-- Primeiro tenta atualizar
UPDATE investidores SET password = '123' WHERE email = 'simao@investidor';

-- Se não existir, insere
INSERT INTO investidores (nome, nif, email, password, telefone, company_id)
SELECT 
    'Simão Pambo Puca', 
    '003254125LA044', 
    'simao@investidor', 
    '123', 
    '+244 923 000 000', 
    1
WHERE NOT EXISTS (SELECT 1 FROM investidores WHERE email = 'simao@investidor');
