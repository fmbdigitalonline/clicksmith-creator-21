
import { supabase } from "@/integrations/supabase/client";
import { SavedAd, SavedAdJson } from "@/types/campaignTypes";
import { Json } from "@/integrations/supabase/types";

// Export this function to fix the missing export error
export const saveAd = async (projectId: string, adData: any): Promise<SavedAdJson> => {
  const savedAd = await saveAdToSupabase(projectId, adData);
  return {
    ...savedAd,
    success: true,
    message: "Ad saved successfully"
  };
};

// Modified to use properties from SavedAd interface
export const saveAdToProject = async (
  projectId: string, 
  adData: any
): Promise<SavedAd> => {
  // Implementation would depend on the actual adData structure
  // Converting whatever structure we have to match SavedAd interface
  
  const savedAd: SavedAd = {
    id: adData.id || crypto.randomUUID(),
    saved_images: adData.saved_images || [],
    headline: adData.headline,
    primary_text: adData.primary_text,
    rating: adData.rating || 0,
    feedback: adData.feedback || "",
    created_at: new Date().toISOString(),
    imageurl: adData.imageurl || adData.imageUrl,
    imageUrl: adData.imageUrl || adData.imageurl,
    platform: adData.platform,
    project_id: projectId,
    size: adData.size
  };

  // Save to database logic...
  return savedAd;
};

export const formatSavedAd = (ad: any): SavedAd => {
  // Handle legacy format or other format conversions
  if ('imageurl' in ad || 'imageUrl' in ad) {
    // This is already in SavedAd format
    return ad as SavedAd;
  }
  
  // Convert from another format to SavedAd
  return {
    id: ad.id || crypto.randomUUID(),
    saved_images: ad.saved_images || [ad.imageurl || ad.imageUrl].filter(Boolean),
    headline: ad.headline,
    primary_text: ad.primary_text,
    rating: ad.rating || 0,
    feedback: ad.feedback || "",
    created_at: ad.created_at || new Date().toISOString(),
    imageurl: ad.imageurl || (ad.imageUrl || ""),
    imageUrl: ad.imageUrl || (ad.imageurl || ""),
    platform: ad.platform,
    project_id: ad.project_id,
    size: ad.size
  };
};

export const saveAdToSupabase = async (projectId: string, adData: any): Promise<SavedAd> => {
  try {
    const { data: project } = await supabase
      .from('projects')
      .select('generated_ads')
      .eq('id', projectId)
      .single();
    
    const savedAd = formatSavedAd(adData);
    
    let generatedAds: SavedAd[] = [];
    if (project?.generated_ads && Array.isArray(project.generated_ads)) {
      // Convert all JSON ads to proper SavedAd objects
      generatedAds = (project.generated_ads as any[]).map(ad => formatSavedAd(ad));
    }
    
    // Check if ad already exists
    const existingAdIndex = generatedAds.findIndex(ad => ad.id === savedAd.id);
    if (existingAdIndex >= 0) {
      // Update existing ad
      generatedAds[existingAdIndex] = savedAd;
    } else {
      // Add new ad
      generatedAds.push(savedAd);
    }
    
    const { error } = await supabase
      .from('projects')
      .update({ generated_ads: generatedAds as unknown as Json })
      .eq('id', projectId);
    
    if (error) throw error;
    
    return savedAd;
  } catch (error) {
    console.error('Error saving ad to Supabase:', error);
    throw error;
  }
};

export const deleteAdFromSupabase = async (projectId: string, adId: string): Promise<boolean | undefined> => {
  try {
    const { data: project } = await supabase
      .from('projects')
      .select('generated_ads')
      .eq('id', projectId)
      .single();
    
    if (!project?.generated_ads || !Array.isArray(project.generated_ads)) {
      return;
    }
    
    // Correctly type the generated_ads array
    const typedAds = (project.generated_ads as any[]).map(ad => formatSavedAd(ad));
    const updatedAds = typedAds.filter(ad => ad.id !== adId);
    
    const { error } = await supabase
      .from('projects')
      .update({ generated_ads: updatedAds as unknown as Json })
      .eq('id', projectId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error deleting ad from Supabase:', error);
    throw error;
  }
};

export const updateAdRating = async (projectId: string, adId: string, rating: number): Promise<boolean | undefined> => {
  try {
    const { data: project } = await supabase
      .from('projects')
      .select('generated_ads')
      .eq('id', projectId)
      .single();
    
    if (!project?.generated_ads || !Array.isArray(project.generated_ads)) {
      return;
    }
    
    // Correctly type the generated_ads array
    const typedAds = (project.generated_ads as any[]).map(ad => formatSavedAd(ad));
    const updatedAds = typedAds.map(ad => {
      if (ad.id === adId) {
        return { ...ad, rating };
      }
      return ad;
    });
    
    const { error } = await supabase
      .from('projects')
      .update({ generated_ads: updatedAds as unknown as Json })
      .eq('id', projectId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating ad rating:', error);
    throw error;
  }
};

export const updateAdFeedback = async (projectId: string, adId: string, feedback: string): Promise<boolean | undefined> => {
  try {
    const { data: project } = await supabase
      .from('projects')
      .select('generated_ads')
      .eq('id', projectId)
      .single();
    
    if (!project?.generated_ads || !Array.isArray(project.generated_ads)) {
      return;
    }
    
    // Correctly type the generated_ads array
    const typedAds = (project.generated_ads as any[]).map(ad => formatSavedAd(ad));
    const updatedAds = typedAds.map(ad => {
      if (ad.id === adId) {
        return { ...ad, feedback };
      }
      return ad;
    });
    
    const { error } = await supabase
      .from('projects')
      .update({ generated_ads: updatedAds as unknown as Json })
      .eq('id', projectId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Error updating ad feedback:', error);
    throw error;
  }
};
