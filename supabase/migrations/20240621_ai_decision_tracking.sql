
-- Create table for tracking AI campaign decisions
CREATE TABLE IF NOT EXISTS ai_campaign_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  decision_type TEXT NOT NULL,
  decision_value TEXT NOT NULL,
  confidence TEXT CHECK (confidence IN ('high', 'medium', 'low')),
  reasoning TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_override TEXT,
  override_reason TEXT,
  
  -- Add index for faster queries
  CONSTRAINT ai_campaign_decisions_campaign_type_idx UNIQUE (campaign_id, decision_type, timestamp)
);

-- Add RLS policies for this table
ALTER TABLE ai_campaign_decisions ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own campaign decisions
CREATE POLICY "Users can insert their own campaign decisions"
  ON ai_campaign_decisions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ad_campaigns
      WHERE ad_campaigns.id = campaign_id
      AND ad_campaigns.user_id = auth.uid()
    )
  );

-- Allow users to read their own campaign decisions
CREATE POLICY "Users can read their own campaign decisions"
  ON ai_campaign_decisions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ad_campaigns
      WHERE ad_campaigns.id = campaign_id
      AND ad_campaigns.user_id = auth.uid()
    )
  );

-- Allow users to update their own campaign decisions (for overrides)
CREATE POLICY "Users can update their own campaign decisions"
  ON ai_campaign_decisions
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM ad_campaigns
      WHERE ad_campaigns.id = campaign_id
      AND ad_campaigns.user_id = auth.uid()
    )
  );

-- Add column to ad_campaigns table to track AI metrics
ALTER TABLE ad_campaigns ADD COLUMN IF NOT EXISTS ai_decisions_applied JSONB;

-- Add column to store AI performance insights
ALTER TABLE ad_campaigns ADD COLUMN IF NOT EXISTS ai_performance_insights JSONB;

-- Create a function to update last updated timestamp on decision changes
CREATE OR REPLACE FUNCTION update_ai_decision_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.timestamp = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update timestamp on changes
CREATE TRIGGER update_ai_decision_timestamp_trigger
BEFORE UPDATE ON ai_campaign_decisions
FOR EACH ROW
EXECUTE FUNCTION update_ai_decision_timestamp();

-- Add statistics view for AI campaign decisions
CREATE OR REPLACE VIEW ai_decision_stats AS
SELECT
  campaign_id,
  COUNT(*) as total_decisions,
  COUNT(CASE WHEN user_override IS NOT NULL THEN 1 END)::float / NULLIF(COUNT(*), 0)::float as override_rate,
  jsonb_object_agg(decision_type, decision_count) as decisions_by_type,
  jsonb_build_object(
    'high', COUNT(CASE WHEN confidence = 'high' THEN 1 END),
    'medium', COUNT(CASE WHEN confidence = 'medium' THEN 1 END),
    'low', COUNT(CASE WHEN confidence = 'low' THEN 1 END)
  ) as decisions_by_confidence
FROM (
  SELECT
    campaign_id,
    decision_type,
    confidence,
    user_override,
    COUNT(*) as decision_count
  FROM
    ai_campaign_decisions
  GROUP BY
    campaign_id, decision_type, confidence, user_override
) subquery
GROUP BY campaign_id;
