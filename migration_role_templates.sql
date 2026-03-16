-- Migration: Add role templates to companies
-- This allows administrators to define default permissions for roles at the company level.

-- 1. Add role_permissions JSONB column to companies
ALTER TABLE companies ADD COLUMN IF NOT EXISTS role_permissions JSONB;

-- 2. Define standard default permissions
-- We'll use a local variable to avoid repeating the JSON
DO $$
DECLARE
    default_perms JSONB := '{
      "admin": {
        "sales": true, "products": true, "customers": true, "hr": true, 
        "accounting": true, "pharmacy": true, "blog": true, "marketing": true, 
        "reports": true, "users": true, "settings": true
      },
      "manager": {
        "sales": true, "products": true, "customers": true, "hr": true, 
        "accounting": true, "pharmacy": true, "blog": true, "marketing": true, 
        "reports": true, "users": false, "settings": false
      },
      "cashier": {
        "sales": true, "products": true, "customers": true, "hr": false, 
        "accounting": false, "pharmacy": false, "blog": false, "marketing": false, 
        "reports": false, "users": false, "settings": false
      }
    }'::jsonb;
BEGIN
    -- Initialize companies that don't have permissions set
    UPDATE companies 
    SET role_permissions = default_perms
    WHERE role_permissions IS NULL OR role_permissions = '{}'::jsonb;
END $$;
