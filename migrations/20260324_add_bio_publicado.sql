-- Add bio_publicado to companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bio_publicado BOOLEAN DEFAULT false;
