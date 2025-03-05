
import { useEffect } from 'react';
import PlatformIntegrations from '@/components/integrations/PlatformIntegrations';

export default function Integrations() {
  useEffect(() => {
    document.title = 'Platform Integrations - Ad Creator';
  }, []);

  return (
    <div className="container mx-auto py-6">
      <PlatformIntegrations />
    </div>
  );
}
