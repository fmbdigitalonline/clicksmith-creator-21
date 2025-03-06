
-- Add fields to store campaign insights data
ALTER TABLE ad_campaigns ADD COLUMN IF NOT EXISTS insights_data JSONB DEFAULT NULL;
ALTER TABLE ad_campaigns ADD COLUMN IF NOT EXISTS insights_last_updated TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create an index on the insights data for better query performance
CREATE INDEX IF NOT EXISTS ad_campaigns_insights_idx ON ad_campaigns USING GIN (insights_data);

-- Update existing campaigns to have empty insights data
UPDATE ad_campaigns 
SET insights_data = '{}'::jsonb 
WHERE insights_data IS NULL;
