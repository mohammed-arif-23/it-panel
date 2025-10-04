-- Update push_subscriptions table to support FCM tokens
-- Run this in Supabase SQL Editor

ALTER TABLE push_subscriptions 
ADD COLUMN IF NOT EXISTS fcm_token TEXT,
ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'web';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_platform ON push_subscriptions(platform);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_fcm_token ON push_subscriptions(fcm_token);

-- Update existing records to set platform as 'web'
UPDATE push_subscriptions SET platform = 'web' WHERE platform IS NULL;
