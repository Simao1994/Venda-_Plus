-- Migration: Add granular permissions to users and access links to companies

-- 1. Add permissions JSONB column to users (if not exists)
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';

-- 2. Add access_token to companies for generating secure access links
ALTER TABLE companies ADD COLUMN IF NOT EXISTS access_token TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS access_link_expires_at TIMESTAMPTZ;

-- 3. Generate default access tokens for existing companies (random base64)
UPDATE companies 
SET access_token = encode(gen_random_bytes(24), 'base64')
WHERE access_token IS NULL;

-- 4. Enable pgcrypto if not already enabled (needed for gen_random_bytes)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 5. Default permissions for roles
-- We'll store permissions as a JSONB object like:
-- { "sales": true, "hr": true, "accounting": false, "pharmacy": false, "blog": true, "users": false }
UPDATE users SET permissions = '{
  "sales": true, "hr": false, "accounting": false, 
  "pharmacy": false, "blog": false, "users": false,
  "reports": false, "customers": true, "products": true,
  "settings": false, "marketing": false
}'::jsonb WHERE role = 'cashier' AND (permissions IS NULL OR permissions = '{}'::jsonb);

UPDATE users SET permissions = '{
  "sales": true, "hr": true, "accounting": true,
  "pharmacy": true, "blog": true, "users": false,
  "reports": true, "customers": true, "products": true,
  "settings": false, "marketing": true
}'::jsonb WHERE role = 'manager' AND (permissions IS NULL OR permissions = '{}'::jsonb);

UPDATE users SET permissions = '{
  "sales": true, "hr": true, "accounting": true,
  "pharmacy": true, "blog": true, "users": true,
  "reports": true, "customers": true, "products": true,
  "settings": true, "marketing": true
}'::jsonb WHERE role = 'admin' AND (permissions IS NULL OR permissions = '{}'::jsonb);

UPDATE users SET permissions = '{
  "sales": true, "hr": true, "accounting": true,
  "pharmacy": true, "blog": true, "users": true,
  "reports": true, "customers": true, "products": true,
  "settings": true, "marketing": true
}'::jsonb WHERE role = 'master' AND (permissions IS NULL OR permissions = '{}'::jsonb);
