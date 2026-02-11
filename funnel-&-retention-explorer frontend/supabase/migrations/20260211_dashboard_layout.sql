-- Add dashboard_layout column to fre_user_profiles
-- Stores user's custom widget layout as JSONB array
ALTER TABLE fre_user_profiles
ADD COLUMN IF NOT EXISTS dashboard_layout JSONB DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN fre_user_profiles.dashboard_layout IS 'Custom dashboard widget layout: [{widgetId, visible, width, order}]';
