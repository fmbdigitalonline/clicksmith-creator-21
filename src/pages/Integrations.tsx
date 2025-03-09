
import { useEffect } from 'react';
import PlatformIntegrations from '@/components/integrations/PlatformIntegrations';

export default function Integrations() {
  useEffect(() => {
    document.title = 'Platform Integrations - Ad Creator';
    
    // Log environment info for debugging
    console.log("Integrations page loaded. Environment info:", {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL ? "Configured" : "Missing",
      supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ? "Configured" : "Missing",
      facebookAppId: import.meta.env.VITE_FACEBOOK_APP_ID ? "Configured" : "Missing",
      facebookRedirectUri: import.meta.env.VITE_FACEBOOK_REDIRECT_URI ? "Configured" : "Missing",
    });
  }, []);

  return (
    <div className="container mx-auto py-6">
      <PlatformIntegrations />
    </div>
  );
}
