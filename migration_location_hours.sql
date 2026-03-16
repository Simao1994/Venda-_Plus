-- Migration: Add location and business hours to branches and companies

-- 1. Add category to companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS category TEXT CHECK (category IN ('Supermercado', 'Farmácia', 'Retalho', 'Outros')) DEFAULT 'Retalho';

-- 2. Add location and hours to branches
ALTER TABLE branches ADD COLUMN IF NOT EXISTS latitude REAL;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS longitude REAL;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{
  "seg": "08:00-20:00",
  "ter": "08:00-20:00",
  "qua": "08:00-20:00",
  "qui": "08:00-20:00",
  "sex": "08:00-20:00",
  "sab": "08:00-18:00",
  "dom": "09:00-13:00"
}'::jsonb;
ALTER TABLE branches ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT FALSE;

-- 3. Seed some sample data for the first branch if it exists
-- Assuming branch 1 is the main branch of the first company
UPDATE branches SET 
  latitude = -8.8368, 
  longitude = 13.2343, 
  is_public = TRUE,
  working_hours = '{
    "seg": "08:00-22:00",
    "ter": "08:00-22:00",
    "qua": "08:00-22:00",
    "qui": "08:00-22:00",
    "sex": "08:00-22:00",
    "sab": "08:00-22:00",
    "dom": "08:00-20:00"
  }'::jsonb
WHERE id = 1;

UPDATE companies SET category = 'Supermercado' WHERE id = 1;

-- 4. Create a public view for partners to avoid exposing internal IDs if possible, 
-- but for simplicity we'll just use the API.
