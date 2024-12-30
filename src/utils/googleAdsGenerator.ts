import { BusinessIdea, TargetAudience, AdHook, AdFormat } from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";

export const generateGoogleAds = async (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  adHooks: AdHook[],
  videoAdsEnabled: boolean,
  existingImageUrl?: string
): Promise<AdFormat[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-ad-content', {
      body: {
        type: 'google_ads',
        businessIdea,
        targetAudience,
        campaign: {
          hooks: adHooks,
          platform: 'google',
          videoAdsEnabled,
          existingImageUrl // Pass the existing image URL to the edge function
        }
      }
    });

    if (error) throw error;
    
    // Ensure each format uses the existing image URL
    if (existingImageUrl && data.formats) {
      data.formats = data.formats.map((format: any) => ({
        ...format,
        image: {
          url: existingImageUrl,
          prompt: "Existing image from Facebook ad"
        },
        imageUrl: existingImageUrl
      }));
    }
    
    return data.formats;
  } catch (error) {
    console.error('Error generating Google ads:', error);
    throw error;
  }
};
