import { useState } from "react";
import { BusinessIdea, TargetAudience, AdHook } from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export const useAdGeneration = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  adHooks: AdHook[]
) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [adVariants, setAdVariants] = useState<any[]>([]);
  const [generationStatus, setGenerationStatus] = useState("");
  const { projectId } = useParams();
  const { toast } = useToast();

  const loadSavedAds = async (platform: string) => {
    if (!projectId) return;

    try {
      const { data: project } = await supabase
        .from('projects')
        .select('generated_ads')
        .eq('id', projectId)
        .single();

      if (project?.generated_ads) {
        const savedAds = project.generated_ads[platform] || [];
        if (savedAds.length > 0) {
          setAdVariants(savedAds);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error loading saved ads:', error);
      return false;
    }
  };

  const saveGeneratedAds = async (platform: string, newVariants: any[]) => {
    if (!projectId) return;

    try {
      const { data: project } = await supabase
        .from('projects')
        .select('generated_ads')
        .eq('id', projectId)
        .single();

      const existingAds = project?.generated_ads || {};
      const updatedAds = {
        ...existingAds as Record<string, any>,
        [platform]: newVariants
      };

      await supabase
        .from('projects')
        .update({ generated_ads: updatedAds })
        .eq('id', projectId);
    } catch (error) {
      console.error('Error saving generated ads:', error);
    }
  };

  const generateAds = async (selectedPlatform: string) => {
    // First try to load saved ads
    const hasSavedAds = await loadSavedAds(selectedPlatform);
    if (hasSavedAds) {
      toast({
        title: "Loaded saved ads",
        description: "Showing your previously generated ads for this platform.",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationStatus("Generating ad content...");
    setAdVariants([]);

    try {
      const { data, error } = await supabase.functions.invoke('generate-ad-content', {
        body: {
          type: 'images',
          businessIdea,
          targetAudience,
          campaign: {
            hooks: adHooks,
            platform: selectedPlatform
          }
        }
      });

      if (error) throw error;

      setGenerationStatus("Processing images...");
      
      const processedVariants = [];
      
      for (const variant of data.variants) {
        try {
          const { data: imageVariant } = await supabase
            .from('ad_image_variants')
            .insert({
              original_image_url: variant.imageUrl,
              resized_image_urls: variant.resizedUrls || {},
              project_id: projectId
            })
            .select()
            .single();

          if (!imageVariant) continue;

          processedVariants.push({
            id: imageVariant.id,
            imageUrl: variant.imageUrl,
            resizedUrls: variant.resizedUrls || {},
            platform: selectedPlatform,
            headline: variant.headline || "",
            description: variant.description || "",
            callToAction: variant.callToAction || "",
            size: variant.size || { width: 1200, height: 628, label: "Default" },
            specs: variant.specs || {}
          });
        } catch (error) {
          console.error('Error processing variant:', error);
        }
      }

      setAdVariants(processedVariants);
      await saveGeneratedAds(selectedPlatform, processedVariants);

      toast({
        title: "Success!",
        description: `Generated ${processedVariants.length} ad variants for ${selectedPlatform}.`,
      });
    } catch (error) {
      console.error('Error generating ads:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate ads",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setGenerationStatus("");
    }
  };

  return {
    isGenerating,
    adVariants,
    generationStatus,
    generateAds,
  };
};