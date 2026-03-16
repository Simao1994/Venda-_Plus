-- Migration to add missing columns to hr_employees
-- Added columns for identification, social security, birth date, and photos.

ALTER TABLE hr_employees 
ADD COLUMN IF NOT EXISTS bilhete TEXT,
ADD COLUMN IF NOT EXISTS numero_ss TEXT,
ADD COLUMN IF NOT EXISTS data_nascimento DATE,
ADD COLUMN IF NOT EXISTS photo_url TEXT;
