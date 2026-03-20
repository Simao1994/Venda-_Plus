-- Migration: Unify Products and Pharmacy Inventory
-- Add 'tipo' and 'lote' columns to products table

DO $$
BEGIN
    -- Add the 'tipo' column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'tipo') THEN
        ALTER TABLE products ADD COLUMN tipo text DEFAULT 'produto' CHECK (tipo IN ('produto', 'medicamento'));
    END IF;

    -- Add the 'lote' column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'lote') THEN
        ALTER TABLE products ADD COLUMN lote text;
    END IF;
END $$;

-- Set default values for existing rows to ensure consistency
UPDATE products SET tipo = 'produto' WHERE tipo IS NULL;
