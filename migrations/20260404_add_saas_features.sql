-- Add features column to saas_subscriptions if it doesn't exist
ALTER TABLE saas_subscriptions ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]';

-- Update checkFeature middleware to allow more flexibility
-- (Already handled in server.ts code, but database must be ready)
