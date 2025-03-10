
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useAdPersistence = (projectId: string | undefined) => {
  const [savedAds, setSavedAds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadSavedAds();
  }, [projectId]);

  const loadSavedAds = async () => {
    if (!projectId || projectId === 'new') return;
    
    setIsLoading(true);
    try {
      const { data: project } = await supabase
        .from('projects')
        .select('generated_ads')
        .eq('id', projectId)
        .single();
      
      if (project?.generated_ads && Array.isArray(project.generated_ads)) {
        // Ensure uniqueness by ad ID when loading
        const uniqueAds = Array.from(
          new Map(project.generated_ads.map((ad: any) => [ad.id, ad])).values()
        );
        setSavedAds(uniqueAds);
      }
    } catch (error) {
      console.error('Error loading saved ads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveGeneratedAds = async (newAds: any[]) => {
    if (!projectId || projectId === 'new') return;

    try {
      // Create a Map to store unique ads by ID
      const uniqueAdsMap = new Map();
      
      // First add existing ads to the map
      savedAds.forEach(ad => uniqueAdsMap.set(ad.id, ad));
      
      // Then add new ads, overwriting any duplicates
      newAds.forEach(ad => uniqueAdsMap.set(ad.id, ad));
      
      // Convert map back to array
      const updatedAds = Array.from(uniqueAdsMap.values());

      const { error: updateError } = await supabase
        .from('projects')
        .update({ generated_ads: updatedAds })
        .eq('id', projectId);

      if (updateError) throw updateError;
      setSavedAds(updatedAds);
    } catch (error) {
      console.error('Error saving generated ads:', error);
    }
  };

  return {
    savedAds,
    isLoading,
    saveGeneratedAds
  };
};
