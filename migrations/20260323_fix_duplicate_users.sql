-- Migration: Fix Duplicate Users
-- Deduplicate users table by email, keeping the oldest record
DELETE FROM users a
USING users b
WHERE a.id > b.id
  AND a.email = b.email;

-- Ensure UNIQUE constraint is active and enforced
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key;
ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);
