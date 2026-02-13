-- Add role column to fre_user_profiles for admin dashboard access control
ALTER TABLE fre_user_profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

-- Add CHECK constraint
ALTER TABLE fre_user_profiles
  ADD CONSTRAINT fre_user_profiles_role_check CHECK (role IN ('user', 'admin'));

-- Create admin_monthly_revenue function for revenue aggregation
CREATE OR REPLACE FUNCTION admin_monthly_revenue()
RETURNS TABLE(month TEXT, revenue BIGINT)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT
    TO_CHAR(created_at, 'YYYY-MM') as month,
    COALESCE(SUM(amount), 0)::BIGINT as revenue
  FROM fre_billing_history
  WHERE status = 'success'
    AND created_at >= NOW() - INTERVAL '12 months'
  GROUP BY TO_CHAR(created_at, 'YYYY-MM')
  ORDER BY month;
$$;
