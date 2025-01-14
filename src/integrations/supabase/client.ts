import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://xorlfvflpihtafugltni.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvcmxmdmZscGlodGFmdWdsdG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyMzA3NDksImV4cCI6MjA0ODgwNjc0OX0.tuvMctblG6Oo6u9C41sBTaqCTbuKAdGLC4C5ZsLCc60";

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    global: {
      headers: {
        'X-Client-Info': 'supabase-js-web'
      }
    }
  }
);