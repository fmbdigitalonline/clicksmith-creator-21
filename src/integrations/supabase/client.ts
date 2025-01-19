import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://xorlfvflpihtafugltni.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhvcmxmdmZscGlodGFmdWdsdG5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzMyMzA3NDksImV4cCI6MjA0ODgwNjc0OX0.tuvMctblG6Oo6u9C41sBTaqCTbuKAdGLC4C5ZsLCc60";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js-web',
    },
    fetch: (url, options = {}) => {
      const retryCount = 3;
      const retryDelay = 1000; // 1 second

      const fetchWithRetry = async (attempt = 0): Promise<Response> => {
        try {
          const response = await fetch(url, {
            ...options,
            credentials: 'include',
          });
          
          if (!response.ok && attempt < retryCount) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          return response;
        } catch (error) {
          if (attempt < retryCount) {
            console.log(`Retry attempt ${attempt + 1} of ${retryCount}`);
            await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
            return fetchWithRetry(attempt + 1);
          }
          throw error;
        }
      };

      return fetchWithRetry();
    },
  },
});