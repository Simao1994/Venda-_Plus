-- Migration: Update Pharmacy FKs to Unified Products
-- Date: 2026-03-20

-- 1. Remove old FK constraints
ALTER TABLE IF EXISTS itens_venda_farmacia DROP CONSTRAINT IF EXISTS itens_venda_farmacia_medicamento_id_fkey;
ALTER TABLE IF EXISTS movimentos_stock_farmacia DROP CONSTRAINT IF EXISTS movimentos_stock_farmacia_medicamento_id_fkey;
ALTER TABLE IF EXISTS itens_receita_medica DROP CONSTRAINT IF EXISTS itens_receita_medica_medicamento_id_fkey;
ALTER TABLE IF EXISTS itens_compra_farmacia DROP CONSTRAINT IF EXISTS itens_compra_farmacia_medicamento_id_fkey;

-- 2. Add new FK constraints pointing to products table
ALTER TABLE IF EXISTS itens_venda_farmacia 
    ADD CONSTRAINT itens_venda_farmacia_medicamento_id_fkey 
    FOREIGN KEY (medicamento_id) REFERENCES products(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS movimentos_stock_farmacia 
    ADD CONSTRAINT movimentos_stock_farmacia_medicamento_id_fkey 
    FOREIGN KEY (medicamento_id) REFERENCES products(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS itens_receita_medica 
    ADD CONSTRAINT itens_receita_medica_medicamento_id_fkey 
    FOREIGN KEY (medicamento_id) REFERENCES products(id) ON DELETE SET NULL;

ALTER TABLE IF EXISTS itens_compra_farmacia 
    ADD CONSTRAINT itens_compra_farmacia_medicamento_id_fkey 
    FOREIGN KEY (medicamento_id) REFERENCES products(id) ON DELETE SET NULL;

-- 3. (Optional but recommended) Map existing data if possible, 
-- but since this is a new integration, we assume we start fresh or the IDs are already re-mapped in the rewired GET.
