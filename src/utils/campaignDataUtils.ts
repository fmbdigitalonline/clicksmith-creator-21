
import { supabase } from "@/integrations/supabase/client";

// Extract and format targeting data from project data
export const extractTargetingData = (targetAudience, audienceAnalysis) => {
  console.log("Extracting targeting data from:", { targetAudience, audienceAnalysis });
  
  if (!targetAudience) return null;
  
  // Default values if data is missing
  const defaultTargeting = {
    age_min: 18,
    age_max: 65,
    gender: "ALL",
    interests: [],
    locations: []
  };
  
  try {
    // Extract age range
    let ageMin = 18;
    let ageMax = 65;
    
    if (targetAudience.age_range) {
      const ageRange = targetAudience.age_range;
      if (typeof ageRange === 'string' && ageRange.includes('-')) {
        const [min, max] = ageRange.split('-').map(a => parseInt(a.trim()));
        if (!isNaN(min)) ageMin = Math.max(13, min);
        if (!isNaN(max)) ageMax = Math.min(65, max);
      }
    }
    
    // Extract gender
    let gender = "ALL";
    if (targetAudience.gender) {
      if (targetAudience.gender.toLowerCase() === "male") {
        gender = "MALE";
      } else if (targetAudience.gender.toLowerCase() === "female") {
        gender = "FEMALE";
      }
    }
    
    // Extract interests from audience analysis
    let interests = [];
    if (audienceAnalysis && audienceAnalysis.interests) {
      interests = Array.isArray(audienceAnalysis.interests)
        ? audienceAnalysis.interests
        : Object.keys(audienceAnalysis.interests || {});
    }
    
    // Extract locations
    let locations = [];
    if (targetAudience.location) {
      locations = Array.isArray(targetAudience.location)
        ? targetAudience.location
        : [targetAudience.location];
    }
    
    return {
      age_min: ageMin,
      age_max: ageMax,
      gender,
      interests,
      locations
    };
  } catch (error) {
    console.error("Error extracting targeting data:", error);
    return defaultTargeting;
  }
};

// Call the Facebook Campaign Manager Edge Function
export const callFacebookCampaignManager = async (action, data) => {
  console.log(`Calling Facebook Campaign Manager with action: ${action}`, data);
  
  try {
    const { data: responseData, error } = await supabase.functions.invoke('facebook-campaign-manager', {
      body: {
        operation: action,
        ...data
      },
    });
    
    if (error) {
      console.error("Response from Facebook Campaign Manager:", { data: responseData, error });
      throw new Error(`Edge function error: ${error.message}`);
    }
    
    console.log("Facebook Campaign Manager response:", responseData);
    return { data: responseData, error: null };
  } catch (error) {
    console.error("Error calling Facebook Campaign Manager:", error);
    return { 
      data: null, 
      error: {
        message: error.message || "Failed to communicate with campaign manager",
        details: error
      }
    };
  }
};
