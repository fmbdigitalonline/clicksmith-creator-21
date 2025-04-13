
import { useState, useEffect } from "react";
import { BusinessIdea, TargetAudience, AdHook } from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import { useAdPersistence } from "./useAdPersistence";
import { useTranslation } from "react-i18next";
import { SavedAd } from "@/types/campaignTypes";

export const useAdGeneration = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  adHooks: AdHook[]
) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const [processingStatus, setProcessingStatus] = useState<{
    inProgress: boolean;
    total: number;
    completed: number;
    failed: number;
  }>({
    inProgress: false,
    total: 0,
    completed: 0,
    failed: 0
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [adVariants, setAdVariants] = useState<any[]>([]);
  const { i18n } = useTranslation();
  const { saveGeneratedAds, processImagesForFacebook } = useAdPersistence(projectId);

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

  // Monitor image processing status for variants
  useEffect(() => {
    if (!processingStatus.inProgress || processingStatus.total === 0) {
      return;
    }

    const checkImageStatuses = async () => {
      try {
        // Get the list of variants that are still processing
        const processingVariantIds = adVariants
          .filter(v => v.image_status === 'processing')
          .map(v => v.id);
          
        if (processingVariantIds.length === 0) {
          // All processing is complete
          setProcessingStatus(prev => ({
            ...prev,
            inProgress: false
          }));
          return;
        }
        
        // Check the status of all processing variants
        const { data, error } = await supabase
          .from('ad_feedback')
          .select('id, image_status, storage_url')
          .in('id', processingVariantIds);
          
        if (error) {
          console.error('Error checking image statuses:', error);
          return;
        }
        
        if (!data || data.length === 0) {
          return;
        }
        
        // Update our local state based on the query results
        let updatedVariants = [...adVariants];
        let newCompleted = 0;
        let newFailed = 0;
        
        data.forEach(item => {
          if (item.image_status === 'ready') {
            newCompleted++;
          } else if (item.image_status === 'failed') {
            newFailed++;
          }
          
          // Update the variant in our local state
          const index = updatedVariants.findIndex(v => v.id === item.id);
          if (index !== -1) {
            updatedVariants[index] = {
              ...updatedVariants[index],
              image_status: item.image_status,
              storage_url: item.storage_url
            };
          }
        });
        
        // Update state with the new information
        setAdVariants(updatedVariants);
        setProcessingStatus(prev => ({
          ...prev,
          completed: prev.completed + newCompleted,
          failed: prev.failed + newFailed
        }));
        
        // Update project if we have a project ID
        if (projectId && projectId !== 'new') {
          await supabase
            .from('projects')
            .update({
              generated_ads: updatedVariants
            })
            .eq('id', projectId);
        }
        
      } catch (error) {
        console.error('Error monitoring image processing:', error);
      }
    };
    
    // Check immediately and then every 3 seconds
    checkImageStatuses();
    const interval = setInterval(checkImageStatuses, 3000);
    
    return () => clearInterval(interval);
  }, [adVariants, processingStatus, projectId]);

  const checkCredits = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: creditCheck, error } = await supabase.rpc(
      'check_user_credits',
      { p_user_id: user.id, required_credits: 1 }
    );

    if (error) {
      throw error;
    }

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

  const handleFacebookImageProcessing = async (variants: any[]) => {
    // Only proceed with Facebook images
    const facebookVariants = variants.filter(v => v.platform === 'facebook');
    if (facebookVariants.length === 0) {
      return;
    }
    
    try {
      console.log('Starting batch image processing for Facebook ads');
      setProcessingStatus({
        inProgress: true,
        total: facebookVariants.length,
        completed: 0,
        failed: 0
      });
      
      // Process images using the imported function
      await processImagesForFacebook(facebookVariants);
      
    } catch (error) {
      console.error('Error in batch image processing:', error);
      toast({
        title: "Processing Error",
        description: "Failed to start image processing for Facebook. This might affect your Facebook ads.",
        variant: "destructive",
      });
    }
  };

  const generateAds = async (selectedPlatform: string) => {
    setIsGenerating(true);
    setGenerationStatus("Checking credits availability...");
    
    try {
      const hasCredits = await checkCredits();
      if (!hasCredits) {
        setIsGenerating(false);
        return;
      }

      setGenerationStatus(`Initializing ${selectedPlatform} ad generation...`);
      console.log('Generating ads for platform:', selectedPlatform, 'with target audience:', targetAudience);
      
      const { data, error } = await supabase.functions.invoke('generate-ad-content', {
        body: {
          type: 'complete_ads',
          platform: selectedPlatform,
          businessIdea,
          targetAudience: {
            ...targetAudience,
            name: targetAudience.name,
            description: targetAudience.description,
            demographics: targetAudience.demographics,
            painPoints: targetAudience.painPoints
          },
          adHooks,
          language: i18n.language
        },
      });

      if (error) {
        throw error;
      }

      console.log('Generation response:', data);
      const variants = validateResponse(data);

      setGenerationStatus("Processing generated content...");
      
      const processedVariants = await Promise.all(variants.map(async (variant: any) => {
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

          // Insert into ad_feedback to enable Facebook processing
          const { data: adFeedback, error: feedbackError } = await supabase
            .from('ad_feedback')
            .insert({
              user_id: (await supabase.auth.getUser()).data.user?.id,
              project_id: projectId !== 'new' ? projectId : null,
              saved_images: [variant.imageUrl],
              primary_text: variant.description,
              headline: variant.headline,
              imageUrl: variant.imageUrl,
              original_url: variant.imageUrl,
              platform: selectedPlatform,
              size: variant.size || { width: 1200, height: 628, label: "Landscape (1.91:1)" },
              image_status: selectedPlatform === 'facebook' ? 'pending' : 'ready',
              feedback: 'generated',
              rating: 5
            })
            .select()
            .single();
            
          if (feedbackError) {
            console.error('Error creating ad feedback record:', feedbackError);
          }

          const newVariant = {
            ...variant,
            id: adFeedback?.id || imageVariant.id,
            imageUrl: variant.imageUrl,
            resizedUrls: variant.resizedUrls || {},
            platform: selectedPlatform,
            image_status: selectedPlatform === 'facebook' ? 'pending' : 'ready'
          };

          return newVariant;
        } catch (error) {
          console.error('Error processing variant:', error);
          throw error; // Let the error bubble up
        }
      }));

      // Filter out any null values and combine with existing variants
      const validVariants = processedVariants.filter(Boolean);
      console.log('Successfully processed variants:', validVariants);
      
      // Save to project if we have a project ID
      if (projectId && projectId !== 'new') {
        await saveGeneratedAds(validVariants as SavedAd[]);
      }
      
      // Update state with new variants
      setAdVariants(prev => {
        // Remove old variants for the same platform if needed
        const filteredPrev = prev.filter(v => v.platform !== selectedPlatform);
        return [...filteredPrev, ...validVariants];
      });
      
      toast({
        title: "Ads generated successfully",
        description: "Your new ad variants are ready!",
      });
      
      // Process Facebook images if needed
      if (selectedPlatform === 'facebook') {
        await handleFacebookImageProcessing(validVariants);
      }
      
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

  const validateResponse = (data: any) => {
    if (!data) {
      throw new Error("No data received from generation");
    }

    const variants = data.variants;
    if (!Array.isArray(variants) || variants.length === 0) {
      throw new Error("Invalid or empty variants received");
    }

    return variants;
  };

  return {
    isGenerating,
    adVariants,
    generationStatus,
    processingStatus,
    generateAds,
    processImagesForFacebook: handleFacebookImageProcessing,
    setAdVariants
  };
};
