import { BusinessIdea, TargetAudience, AdHook } from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import { AdVariant, convertJsonToAdVariant, convertAdVariantToJson } from "@/types/adVariant";
import { useAdValidation } from "./useAdValidation";
import { useAdPersistence } from "./useAdPersistence";

export const useAdGeneration = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  adHooks: AdHook[]
) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [adVariants, setAdVariants] = useState<AdVariant[]>([]);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { savedAds, isLoading, saveGeneratedAds } = useAdPersistence(projectId);
  const { checkCredits, validateResponse } = useAdValidation();

  // Load saved ad variants when component mounts
  useEffect(() => {
    if (savedAds && savedAds.length > 0) {
      const validVariants = savedAds
        .map(json => convertJsonToAdVariant(json))
        .filter((variant): variant is AdVariant => variant !== null);
      setAdVariants(validVariants);
    }
  }, [savedAds]);

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
        },
      });

      if (error) throw error;

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
              project_id: projectId !== 'new' ? projectId : null,
              user_id: (await supabase.auth.getUser()).data.user?.id
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
          } as AdVariant;
        } catch (error) {
          console.error('Error processing variant:', error);
          return null;
        }
      }));

      const validVariants = processedVariants.filter((variant): variant is AdVariant => variant !== null);
      
      // Save to project if we have a project ID
      if (projectId && projectId !== 'new') {
        await saveGeneratedAds(validVariants);
      }
      
      setAdVariants(prev => [...prev, ...validVariants]);
      
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

  return {
    isGenerating,
    adVariants,
    generationStatus,
    generateAds,
  };
};