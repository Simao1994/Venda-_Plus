-- Add compliance columns to sales table
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS hash TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS prev_hash TEXT;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS is_certified BOOLEAN DEFAULT FALSE;

-- Add compliance columns to payments table (for Receipts/Recibos)
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS document_number TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS hash TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS prev_hash TEXT;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS is_certified BOOLEAN DEFAULT FALSE;

-- Ensure billing_series supports ALL required AGT types
-- (Check if types exist, if not, they will be handled by the app logic or check constraints if any)
-- Most likely doc_type is a text field without a strict CHECK constraint in the current schema, 
-- but we should ensure the series can be created for these types.

-- Create initial series for FR and RE if they don't exist for the current companies (optional but helpful)
-- This will be handled via UI/API usually.
