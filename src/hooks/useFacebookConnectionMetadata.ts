
import { useEffect, useState } from 'react';
import { PlatformConnectionMetadata, AdAccount, FacebookPage } from '@/types/platformConnection';
import { Json } from '@/integrations/supabase/types';

export function useFacebookConnectionMetadata(metadata: Json | null) {
  const [typedMetadata, setTypedMetadata] = useState<PlatformConnectionMetadata | null>(null);
  
  useEffect(() => {
    if (metadata) {
      // Convert Json to PlatformConnectionMetadata
      try {
        // If metadata is a string, parse it
        const parsedMetadata = typeof metadata === 'string' 
          ? JSON.parse(metadata) as PlatformConnectionMetadata
          : metadata as unknown as PlatformConnectionMetadata;
        
        setTypedMetadata(parsedMetadata);
      } catch (error) {
        console.error('Error parsing metadata:', error);
        setTypedMetadata(null);
      }
    } else {
      setTypedMetadata(null);
    }
  }, [metadata]);

  // Helper function to prepare metadata for saving to database
  const prepareMetadataForSave = (updatedMetadata: PlatformConnectionMetadata): Json => {
    // Convert the typed metadata to a format compatible with Json type
    return updatedMetadata as unknown as Json;
  };

  return { typedMetadata, prepareMetadataForSave };
}
