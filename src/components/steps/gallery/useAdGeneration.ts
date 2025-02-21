
import { BusinessIdea, TargetAudience, AdHook } from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  const navigate = useNavigate();
  const { projectId } = useParams();

  // Load saved ad variants when component mounts
  useEffect(() => {
    const loadSavedAds = async () => {
      if (projectId && projectId !== 'new') {
        const { data: project } = await supabase
          .from('projects')
          .select('generated_ads')
          .eq('id', projectId)
          .single();
        
        if (project?.generated_ads && Array.isArray(project.generated_ads)) {
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
      console.log('Generating ads for platform:', selectedPlatform);
      
      const { data, error } = await supabase.functions.invoke('generate-ad-content', {
        body: {
          type: 'complete_ads',
          platform: selectedPlatform,
          businessIdea,
          targetAudience,
          adHooks,
        },
      });

      if (error) throw error;

      console.log('Generation response:', data);
      const variants = validateResponse(data);

      setGenerationStatus("Processing generated content...");
      
      const processedVariants = await Promise.all(variants.map(async (variant: any) => {
        const imageUrl = variant.imageUrl || variant.image?.url;
        const imagePrompt = variant.image?.prompt || variant.prompt;

        if (!imageUrl) {
          console.warn('Variant missing image URL:', variant);
          return null;
        }

        if (!imagePrompt) {
          console.warn('Variant missing prompt:', variant);
        }

        try {
          const { data: imageVariant, error: storeError } = await supabase
            .from('ad_image_variants')
            .insert({
              original_image_url: imageUrl,
              prompt: imagePrompt,
              metadata: {
                platform: selectedPlatform,
                size: variant.size,
                originalVariant: variant
              },
              user_id: (await supabase.auth.getUser()).data.user?.id,
              project_id: projectId !== 'new' ? projectId : null
            })
            .select()
            .single();

          if (storeError) {
            console.error('Error storing image variant:', storeError);
            return null;
          }

          const newVariant = {
            ...variant,
            id: imageVariant.id,
            imageUrl: imageUrl,
            image: {
              url: imageUrl,
              prompt: imagePrompt
            },
            platform: selectedPlatform
          };

          // Save to project if we have a project ID
          if (projectId && projectId !== 'new') {
            const updatedVariants = [...adVariants, newVariant];
            
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
          return null;
        }
      }));

      // Filter out any null values and combine with existing variants
      const validVariants = processedVariants.filter(Boolean);
      
      setAdVariants(prev => {
        const filteredPrev = prev.filter(v => v.platform !== selectedPlatform);
        return [...filteredPrev, ...validVariants];
      });
      
      setRegenerationCount(prev => prev + 1);
      
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
