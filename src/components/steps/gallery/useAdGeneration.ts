import { BusinessIdea, TargetAudience, AdHook } from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { useState, useEffect } from "react";

export const useAdGeneration = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  adHooks: AdHook[]
) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [adVariants, setAdVariants] = useState<any[]>([]);
  const [regenerationCount, setRegenerationCount] = useState(0);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { projectId } = useParams();

  // Load saved ad variants when component mounts
  useEffect(() => {
    const loadSavedAds = async () => {
      console.log('Loading saved ads for project:', projectId);
      if (projectId && projectId !== 'new') {
        const { data: project } = await supabase
          .from('projects')
          .select('generated_ads')
          .eq('id', projectId)
          .single();
        
        console.log('Loaded project data:', project);
        
        if (project?.generated_ads && Array.isArray(project.generated_ads)) {
          console.log('Setting ad variants from project:', project.generated_ads);
          setAdVariants(project.generated_ads);
        }
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

  const processImagesForFacebook = async (variants: any[]) => {
    // Start image processing for all variants
    try {
      console.log('Starting background image processing for Facebook ads');
      
      const processPromises = variants.map(async (variant) => {
        if (!variant.id || !variant.imageUrl) return variant;
        
        try {
          console.log(`Processing image for variant ${variant.id}`);
          
          // First update status to processing immediately
          await supabase
            .from('ad_feedback')
            .update({ image_status: 'processing' })
            .eq('id', variant.id);
          
          const { data, error } = await supabase.functions.invoke('migrate-images', {
            body: { adId: variant.id }
          });
          
          if (error) {
            console.error(`Error invoking migrate-images for variant ${variant.id}:`, error);
            return variant;
          }
          
          console.log(`Image processing response for variant ${variant.id}:`, data);
          
          if (data && data.success && data.storage_url) {
            // Update the variant with the storage URL
            console.log(`Updated variant ${variant.id} with storage URL: ${data.storage_url}`);
            return {
              ...variant,
              storage_url: data.storage_url,
              image_status: 'ready'
            };
          }
        } catch (processError) {
          console.error('Error processing image for variant', variant.id, processError);
        }
        
        return variant;
      });
      
      try {
        const results = await Promise.allSettled(processPromises);
        console.log('Image processing results:', results);
      } catch (error) {
        console.error('Error in background image processing:', error);
      }
      
    } catch (error) {
      console.error('Error starting image processing:', error);
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
              image_status: 'pending',
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
            image_status: 'pending'
          };

          // Save to project if we have a project ID
          if (projectId && projectId !== 'new') {
            // Merge new variants with existing ones
            const updatedVariants = [...adVariants, newVariant];
            console.log('Saving updated variants to project:', updatedVariants);
            
            const { error: updateError } = await supabase
              .from('projects')
              .update({
                generated_ads: updatedVariants
              })
              .eq('id', projectId);

            if (updateError) {
              console.error('Error updating project:', updateError);
            }
          }

          return newVariant;
        } catch (error) {
          console.error('Error processing variant:', error);
          throw error; // Let the error bubble up
        }
      }));

      // Filter out any null values and combine with existing variants
      const validVariants = processedVariants.filter(Boolean);
      console.log('Successfully processed variants:', validVariants);
      
      // Update state with new variants
      setAdVariants(prev => {
        // Remove old variants for the same platform
        const filteredPrev = prev.filter(v => v.platform !== selectedPlatform);
        return [...filteredPrev, ...validVariants];
      });
      
      setRegenerationCount(prev => prev + 1);
      
      toast({
        title: "Ads generated successfully",
        description: "Your new ad variants are ready!",
      });
      
      // Process images for Facebook in the background
      if (selectedPlatform === 'facebook') {
        // Timeout to let the UI update first
        setTimeout(() => {
          processImagesForFacebook(validVariants);
        }, 500);
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
    regenerationCount,
    generationStatus,
    generateAds,
  };
};
