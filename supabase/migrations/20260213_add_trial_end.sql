-- Add trial_end column to fre_user_profiles
ALTER TABLE fre_user_profiles ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ DEFAULT NULL;
