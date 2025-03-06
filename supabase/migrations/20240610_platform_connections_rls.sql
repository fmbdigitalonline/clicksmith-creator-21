
-- Set up RLS policies for platform_connections table
ALTER TABLE IF EXISTS platform_connections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (if any) to prevent conflicts
DROP POLICY IF EXISTS "Users can view their own connections" ON platform_connections;
DROP POLICY IF EXISTS "Users can insert their own connections" ON platform_connections;
DROP POLICY IF EXISTS "Users can update their own connections" ON platform_connections;
DROP POLICY IF EXISTS "Users can delete their own connections" ON platform_connections;

-- Create new RLS policies
CREATE POLICY "Users can view their own connections"
  ON platform_connections
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own connections"
  ON platform_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own connections"
  ON platform_connections
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own connections"
  ON platform_connections
  FOR DELETE
  USING (auth.uid() = user_id);

-- Make sure platform_connections has all the required fields
DO $$
BEGIN
    -- Check if platform column exists and is of type platform_type
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'platform_connections' AND column_name = 'platform'
    ) THEN
        ALTER TABLE platform_connections ADD COLUMN platform platform_type NOT NULL;
    END IF;

    -- Check if platform_type enum type exists
    IF NOT EXISTS (
        SELECT 1
        FROM pg_type
        WHERE typname = 'platform_type'
    ) THEN
        CREATE TYPE platform_type AS ENUM ('facebook', 'google', 'tiktok', 'linkedin');
    END IF;
    
EXCEPTION
    WHEN duplicate_object THEN
        NULL; -- Handle case where type already exists
END $$;

-- Add index for faster querying
CREATE INDEX IF NOT EXISTS platform_connections_user_id_idx ON platform_connections (user_id);
CREATE INDEX IF NOT EXISTS platform_connections_platform_idx ON platform_connections (platform);
