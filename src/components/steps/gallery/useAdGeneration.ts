
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

  const processImagesForFacebook = async (variants: any[]) => {
    // Only proceed if we have variants to process
    if (!variants || variants.length === 0) {
      return;
    }
    
    try {
      console.log('Starting batch image processing for Facebook ads');
      setProcessingStatus({
        inProgress: true,
        total: variants.length,
        completed: 0,
        failed: 0
      });
      
      // Create array of variant IDs for batch processing
      const variantIds = variants
        .filter(v => v.id && v.imageUrl)
        .map(v => v.id);
      
      if (variantIds.length === 0) {
        console.log('No valid variants to process');
        return;
      }
      
      // Update variants to processing state immediately in local state
      setAdVariants(prev => {
        const updated = [...prev];
        variantIds.forEach(id => {
          const index = updated.findIndex(v => v.id === id);
          if (index !== -1) {
            updated[index] = {
              ...updated[index],
              image_status: 'processing'
            };
          }
        });
        return updated;
      });
      
      // Call the edge function with all IDs for batch processing
      const { data, error } = await supabase.functions.invoke('migrate-images', {
        body: { adIds: variantIds }
      });
      
      if (error) {
        console.error(`Error invoking migrate-images:`, error);
        toast({
          title: "Processing Error",
          description: "There was an error starting image processing. Some images may not be available for Facebook ads.",
          variant: "destructive",
        });
        return;
      }
      
      console.log(`Batch image processing response:`, data);
      
      // Check results and update UI
      if (data && data.processed) {
        // Count successes and failures
        const successCount = data.processed.filter((r: any) => r.success).length;
        const failCount = data.processed.length - successCount;
        
        toast({
          title: "Image Processing Update",
          description: `Started processing ${data.processed.length} images. ${successCount} completed immediately.`,
        });
        
        // Update processing status
        setProcessingStatus(prev => ({
          ...prev,
          completed: prev.completed + successCount,
          failed: prev.failed + failCount
        }));
      }
      
    } catch (error) {
      console.error('Error in batch image processing:', error);
      toast({
        title: "Processing Error",
        description: "Failed to start image processing. Please try again later.",
        variant: "destructive",
      });
      
      // Reset processing status
      setProcessingStatus({
        inProgress: false,
        total: 0,
        completed: 0,
        failed: 0
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
      
      // Process images for Facebook in the background - with improved batch processing
      if (selectedPlatform === 'facebook' && validVariants.length > 0) {
        // Start processing immediately
        processImagesForFacebook(validVariants);
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
    processingStatus,
    generateAds,
    processImagesForFacebook
  };
};
