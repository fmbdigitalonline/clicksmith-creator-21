
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
    
    // Try to extract age from demographics if age_range not present
    if (!targetAudience.age_range && targetAudience.demographics) {
      const demographics = targetAudience.demographics;
      if (typeof demographics === 'string') {
        // Look for patterns like "35-45 years old" in demographics string
        const ageMatch = demographics.match(/(\d+)[-\s]*(\d+)[\s]*years?\s*old/i);
        if (ageMatch && ageMatch.length >= 3) {
          const [_, min, max] = ageMatch;
          if (!isNaN(parseInt(min))) ageMin = Math.max(13, parseInt(min));
          if (!isNaN(parseInt(max))) ageMax = Math.min(65, parseInt(max));
        }
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
    } else if (targetAudience.demographics) {
      // Try to extract gender from demographics string
      const demographics = targetAudience.demographics;
      if (typeof demographics === 'string') {
        if (demographics.toLowerCase().includes("female")) {
          gender = "FEMALE";
        } else if (demographics.toLowerCase().includes("male")) {
          gender = "MALE";
        }
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
    
    // Format locations for Facebook API
    const formattedLocations = locations.length > 0 
      ? locations.map(loc => {
          // Check if it's a country code
          if (typeof loc === 'string' && loc.length === 2) {
            return { key: 'countries', value: [loc.toUpperCase()] };
          }
          // Check if it's a city
          else if (typeof loc === 'string' && loc.indexOf(',') > -1) {
            return { key: 'cities', value: [loc.trim()] };
          }
          // Default to US
          return { key: 'countries', value: ['US'] };
        })
      : [{ key: 'countries', value: ['US'] }];
    
    return {
      age_min: ageMin,
      age_max: ageMax,
      gender,
      interests,
      locations: formattedLocations
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
    // Get auth token for the user
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    
    if (!accessToken) {
      throw new Error("No authentication token available. Please log in again.");
    }
    
    const { data: responseData, error } = await supabase.functions.invoke('facebook-campaign-manager', {
      body: {
        operation: action,
        ...data
      },
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
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
