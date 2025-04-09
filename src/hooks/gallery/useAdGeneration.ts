
import { useState, useEffect } from "react";
import { BusinessIdea, TargetAudience, AdHook } from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import { useAdPersistence } from "./useAdPersistence";
import { useTranslation } from "react-i18next";

export const useAdGeneration = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  adHooks: AdHook[]
) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [adVariants, setAdVariants] = useState<any[]>([]);
  const { i18n } = useTranslation();
  const [processingStatus, setProcessingStatus] = useState({
    inProgress: false,
    total: 0,
    completed: 0,
    failed: 0
  });

  useEffect(() => {
    const loadSavedAds = async () => {
      if (!projectId || projectId === 'new') return;

      setGenerationStatus("Loading saved ads...");
      try {
        const { data: project } = await supabase
          .from('projects')
          .select('generated_ads')
          .eq('id', projectId)
          .single();
        
        if (project?.generated_ads && Array.isArray(project.generated_ads)) {
          setAdVariants(project.generated_ads);
        }
      } catch (error) {
        console.error('Error loading saved ads:', error);
      } finally {
        setGenerationStatus("");
      }
    };

    loadSavedAds();
  }, [projectId]);

  const checkCredits = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: creditCheck, error } = await supabase.rpc(
      'check_user_credits',
      { p_user_id: user.id, required_credits: 1 }
    );

    if (error) throw error;

    const result = creditCheck[0];
    
    if (!result.has_credits) {
      toast({
        title: "No credits available",
        description: result.error_message,
        variant: "destructive",
      });
      navigate('/pricing');
      return false;
    }

    return true;
  };

  const generateAds = async (selectedPlatform: string) => {
    setIsGenerating(true);
    setGenerationStatus("Checking credits availability...");
    
    try {
      const hasCredits = await checkCredits();
      if (!hasCredits) return;

      setGenerationStatus("Initializing ad generation...");
      
      const { data, error } = await supabase.functions.invoke('generate-ad-content', {
        body: {
          type: 'complete_ads',
          platform: selectedPlatform,
          businessIdea,
          targetAudience,
          adHooks,
          language: i18n.language
        },
      });

      if (error) throw error;

      setGenerationStatus("Processing generated content...");
      
      const processedVariants = await Promise.all(data.variants.map(async (variant: any) => {
        if (!variant.imageUrl) {
          console.warn('Variant missing imageUrl:', variant);
          return null;
        }

        try {
          const { data: imageVariant, error: storeError } = await supabase
            .from('ad_image_variants')
            .insert({
              original_image_url: variant.imageUrl,
              resized_image_urls: variant.resizedUrls || {},
              user_id: (await supabase.auth.getUser()).data.user?.id,
              project_id: projectId !== 'new' ? projectId : null
            })
            .select()
            .single();

          if (storeError) {
            console.error('Error storing image variant:', storeError);
            return null;
          }

          return {
            ...variant,
            id: imageVariant.id,
            imageUrl: variant.imageUrl,
            resizedUrls: variant.resizedUrls || {},
            platform: selectedPlatform
          };
        } catch (error) {
          console.error('Error processing variant:', error);
          return null;
        }
      }));

      const validVariants = processedVariants.filter(Boolean);
      
      if (projectId && projectId !== 'new') {
        const newVariants = [...adVariants, ...validVariants];
        const { error: updateError } = await supabase
          .from('projects')
          .update({
            generated_ads: newVariants
          })
          .eq('id', projectId);

        if (updateError) {
          console.error('Error updating project:', updateError);
          throw updateError;
        }
        
        setAdVariants(newVariants);
      } else {
        setAdVariants(prev => [...prev, ...validVariants]);
      }

      toast({
        title: "Ads generated successfully",
        description: "Your new ad variants are ready!",
      });
    } catch (error: any) {
      console.error('Ad generation error:', error);
      toast({
        title: "Error generating ads",
        description: error.message || "Failed to generate ads. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setGenerationStatus("");
    }
  };

  const processImagesForFacebook = async (facebookAds: any[]) => {
    if (facebookAds.length === 0) return;
    
    setProcessingStatus({
      inProgress: true,
      total: facebookAds.length,
      completed: 0,
      failed: 0
    });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const results = await Promise.all(
        facebookAds.map(async (ad) => {
          try {
            const adId = ad.id;
            const imageUrl = ad.imageUrl || ad.image?.url;
            
            if (!adId || !imageUrl) {
              console.warn('Missing adId or imageUrl:', { adId, imageUrl });
              return { success: false, error: 'Missing adId or imageUrl' };
            }

            const { data, error } = await supabase.functions.invoke('migrate-images', {
              body: { adId }
            });

            if (error) {
              console.error('Error migrating image:', error);
              return { success: false, error: error.message };
            }

            return { success: true, data };
          } catch (error) {
            console.error('Error processing Facebook image:', error);
            return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
          }
        })
      );

      const completed = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      
      setProcessingStatus({
        inProgress: false,
        total: facebookAds.length,
        completed,
        failed
      });

      if (failed > 0) {
        toast({
          title: "Processing Incomplete",
          description: `${completed} of ${facebookAds.length} images processed. ${failed} failed.`,
          variant: "warning",
        });
      } else {
        toast({
          title: "Processing Complete",
          description: `All ${completed} images processed for Facebook.`,
        });
      }

    } catch (error) {
      console.error('Error processing Facebook images:', error);
      setProcessingStatus(prev => ({
        ...prev, 
        inProgress: false,
        failed: prev.total - prev.completed
      }));
      throw error;
    }
  };

  return {
    isGenerating,
    adVariants,
    setAdVariants,
    generationStatus,
    processingStatus,
    generateAds,
    processImagesForFacebook,
  };
};
