
-- Create table for tracking AI suggestion feedback
CREATE TABLE IF NOT EXISTS ai_suggestion_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('targeting', 'budget', 'objective', 'performance')),
  action TEXT NOT NULL CHECK (action IN ('applied', 'helpful', 'unhelpful', 'dismissed')),
  suggestion_content TEXT,
  suggestion_confidence TEXT CHECK (suggestion_confidence IN ('high', 'medium', 'low')),
  current_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Add index for faster queries
  CONSTRAINT ai_suggestion_feedback_user_project_idx UNIQUE (user_id, project_id, suggestion_type, created_at)
);

-- Add RLS policies for this table
ALTER TABLE ai_suggestion_feedback ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own feedback
CREATE POLICY "Users can insert their own feedback"
  ON ai_suggestion_feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow users to read their own feedback
CREATE POLICY "Users can read their own feedback"
  ON ai_suggestion_feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to update their own feedback (if needed)
CREATE POLICY "Users can update their own feedback"
  ON ai_suggestion_feedback
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
