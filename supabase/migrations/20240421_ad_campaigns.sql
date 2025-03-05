
-- Create ad_campaigns table if it doesn't exist
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  project_id UUID REFERENCES projects,
  platform VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  platform_campaign_id VARCHAR(255),
  platform_ad_set_id VARCHAR(255),
  platform_ad_id VARCHAR(255),
  campaign_data JSONB,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add user id automatically from auth context
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own campaigns"
  ON ad_campaigns
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own campaigns"
  ON ad_campaigns
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns"
  ON ad_campaigns
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns"
  ON ad_campaigns
  FOR DELETE
  USING (auth.uid() = user_id);

-- Set user_id automatically on insert
CREATE OR REPLACE FUNCTION set_ad_campaign_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id := auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER set_ad_campaign_user_id_trigger
  BEFORE INSERT ON ad_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION set_ad_campaign_user_id();

-- Create updated_at trigger
CREATE TRIGGER update_ad_campaigns_updated_at
  BEFORE UPDATE ON ad_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
