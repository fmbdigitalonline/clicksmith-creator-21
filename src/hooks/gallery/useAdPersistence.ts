import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdVariant, convertJsonArrayToAdVariants, convertAdVariantToJson } from "@/types/adVariant";

export const useAdPersistence = (projectId: string | undefined) => {
  const [savedAds, setSavedAds] = useState<AdVariant[]>([]);
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
      
      if (project?.generated_ads) {
        const ads = convertJsonArrayToAdVariants(project.generated_ads);
        setSavedAds(ads);
      }
    } catch (error) {
      console.error('Error loading saved ads:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveGeneratedAds = async (newAds: AdVariant[]) => {
    if (!projectId || projectId === 'new') return;

    try {
      const jsonAds = newAds.map(convertAdVariantToJson);
      
      // Merge new ads with existing ones, avoiding duplicates
      const updatedAds = [...savedAds, ...newAds].filter((ad, index, self) => 
        index === self.findIndex((t) => t.id === ad.id)
      );

      const { error: updateError } = await supabase
        .from('projects')
        .update({ generated_ads: jsonAds })
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