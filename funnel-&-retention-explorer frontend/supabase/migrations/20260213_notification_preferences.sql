-- Add notification preferences column to user profiles
ALTER TABLE fre_user_profiles
  ADD COLUMN IF NOT EXISTS notification_preferences JSONB
  DEFAULT '{"analysis":true,"import":true,"ai":true,"export":true,"desktop":true}';
