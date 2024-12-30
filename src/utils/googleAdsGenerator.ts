import { BusinessIdea, TargetAudience, AdHook, GoogleAdFormat } from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";

export const generateGoogleAds = async (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  adHooks: AdHook[],
  videoAdsEnabled: boolean
): Promise<GoogleAdFormat[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-ad-content', {
      body: {
        type: 'google_ads',
        businessIdea,
        targetAudience,
        campaign: {
          hooks: adHooks,
          platform: 'google',
          videoAdsEnabled
        }
      }
    });

    if (error) throw error;
    return data.formats;
  } catch (error) {
    console.error('Error generating Google ads:', error);
    throw error;
  }
};