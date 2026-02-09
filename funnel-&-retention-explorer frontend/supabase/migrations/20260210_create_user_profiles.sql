-- PI-1: fre_user_profiles table for plan management
-- Run this in Supabase SQL Editor or via CLI migration

CREATE TABLE IF NOT EXISTS fre_user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  plan_started_at TIMESTAMPTZ,
  toss_customer_key TEXT,
  toss_billing_key TEXT,
  subscription_status TEXT DEFAULT 'none'
    CHECK (subscription_status IN ('none', 'active', 'cancelled', 'past_due')),
  next_billing_date DATE,
  ai_calls_today INT NOT NULL DEFAULT 0,
  ai_calls_reset_at DATE NOT NULL DEFAULT CURRENT_DATE,
  csv_row_limit INT NOT NULL DEFAULT 10000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE fre_user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY own_profile_select ON fre_user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY own_profile_update ON fre_user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY service_role_all ON fre_user_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Auto-insert trigger for new users
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO fre_user_profiles (id, toss_customer_key)
  VALUES (NEW.id, gen_random_uuid()::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_fre_user_profiles_updated_at
  BEFORE UPDATE ON fre_user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
