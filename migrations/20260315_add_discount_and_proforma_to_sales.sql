-- Migration: Add discount and pro_forma to sales
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount REAL DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS is_pro_forma BOOLEAN DEFAULT FALSE;
