
import { supabase } from "@/integrations/supabase/client";
import { AdHook, AdImage } from "@/types/adWizard";
import { v4 as uuidv4 } from 'uuid';

interface SaveAdParams {
  image: AdImage;
  hook: AdHook;
  rating: string;
  feedback: string;
  projectId?: string;
  primaryText?: string;
  headline?: string;
}

interface SaveAdResult {
  success: boolean;
  message: string;
  shouldCreateProject?: boolean;
  adId?: string;
}

export const saveAd = async ({
  image,
  hook,
  rating,
  feedback,
  projectId,
  primaryText,
  headline
}: SaveAdParams): Promise<SaveAdResult> => {
  try {
    if (!rating) {
      return {
        success: false,
        message: "Please provide a rating before saving."
      };
    }

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return {
        success: false,
        message: "You must be logged in to save feedback"
      };
    }

    if (!projectId) {
      return {
        success: false,
        message: "No project selected",
        shouldCreateProject: true
      };
    }

    // Check if this image is already saved for this user+project
    const { data: existingAds, error: checkError } = await supabase
      .from('ad_feedback')
      .select('id')
      .eq('user_id', user.id)
      .eq('project_id', projectId)
      .or(`imageurl.eq.${image.url},imageUrl.eq.${image.url}`);
    
    if (checkError) {
      console.error('Error checking existing ads:', checkError);
    }
    
    // If the ad is already saved, return early
    if (existingAds && existingAds.length > 0) {
      return {
        success: false,
        message: "This ad has already been saved to your gallery."
      };
    }

    const feedbackData = {
      id: uuidv4(),
      user_id: user.id,
      project_id: projectId,
      rating: parseInt(rating, 10),
      feedback,
      primary_text: primaryText || hook.text || null,
      headline: headline || hook.description || null,
      imageurl: image.url,
      imageUrl: image.url,  // Add both formats for consistency
      platform: 'facebook',
      size: {
        width: 1200,
        height: 628,
        label: "Landscape (1.91:1)"
      }
    };

    // Log what we're attempting to save
    console.log('Attempting to save ad with data:', {
      project_id: projectId,
      imageurl: image.url,
      primary_text: primaryText || hook.text || null,
      headline: headline || hook.description || null
    });

    const { data, error: feedbackError } = await supabase
      .from('ad_feedback')
      .insert(feedbackData)
      .select()
      .single();

    if (feedbackError) {
      console.error('Error saving ad:', feedbackError);
      throw feedbackError;
    }

    // Log successful save
    console.log('Successfully saved ad with ID:', data.id);

    return {
      success: true,
      message: "Your ad has been saved to your gallery.",
      adId: data.id
    };
  } catch (error) {
    console.error('Error in saveAd:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to save ad."
    };
  }
};
