-- Annual Billing: Add billing_cycle column to fre_user_profiles
-- Existing Pro users default to 'monthly' (backward compatible)

ALTER TABLE fre_user_profiles
  ADD COLUMN IF NOT EXISTS billing_cycle TEXT NOT NULL DEFAULT 'monthly'
    CHECK (billing_cycle IN ('monthly', 'annual'));
