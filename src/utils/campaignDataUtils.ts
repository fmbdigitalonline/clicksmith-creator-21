
import { TargetAudience } from "@/types/adWizard";

/**
 * Extracts targeting data from target audience and audience analysis
 * 
 * @param targetAudience The target audience information
 * @param audienceAnalysis Additional analysis data
 * @returns Formatted targeting data for campaign creation
 */
export const extractTargetingData = (targetAudience: TargetAudience, audienceAnalysis?: any) => {
  console.log("Extracting targeting data from:", { targetAudience, audienceAnalysis });
  
  // Default age range for targeting
  let ageMin = 18;
  let ageMax = 65;
  
  // Try to extract age range from demographics
  if (targetAudience.demographics) {
    const ageMatch = targetAudience.demographics.match(/(\d+)-(\d+)/);
    if (ageMatch && ageMatch.length >= 3) {
      ageMin = parseInt(ageMatch[1]);
      ageMax = parseInt(ageMatch[2]);
      
      // Ensure values are within Facebook's allowed range (13-65)
      ageMin = Math.max(13, Math.min(65, ageMin));
      ageMax = Math.max(13, Math.min(65, ageMax));
    }
  }
  
  // Generate interests from audience data
  let interests: string[] = [];
  let gender: "ALL" | "MALE" | "FEMALE" = "ALL";
  
  // Extract gender if predominantly one type is mentioned
  if (targetAudience.demographics) {
    if (targetAudience.demographics.toLowerCase().includes("female") && 
        !targetAudience.demographics.toLowerCase().includes("male")) {
      gender = "FEMALE";
    } else if (targetAudience.demographics.toLowerCase().includes("male") && 
              !targetAudience.demographics.toLowerCase().includes("female")) {
      gender = "MALE";
    }
  }
  
  // Generate interests from audience description and pain points
  const generateInterests = () => {
    const interestSources = [
      targetAudience.description,
      targetAudience.painPoints?.join(" "),
      audienceAnalysis?.marketDesire,
      audienceAnalysis?.expandedDefinition
    ].filter(Boolean).join(" ");
    
    // Extract potential interests
    const potentialInterests = new Set<string>();
    
    // Common interest categories
    const interestCategories = [
      "technology", "business", "finance", "investing", "education", 
      "parenting", "health", "fitness", "wellness", "beauty", 
      "fashion", "travel", "food", "cooking", "home", "real estate", 
      "gardening", "pets", "sports", "outdoors", "music", "art", 
      "books", "writing", "photography", "digital marketing", 
      "entrepreneurship", "career development", "personal growth"
    ];
    
    // Check for presence of interest categories
    interestCategories.forEach(category => {
      if (interestSources.toLowerCase().includes(category)) {
        potentialInterests.add(category.charAt(0).toUpperCase() + category.slice(1));
      }
    });
    
    // Convert to array and return up to 10 interests
    return Array.from(potentialInterests).slice(0, 10);
  };
  
  interests = generateInterests();
  
  // Create and return targeting object
  return {
    age_min: ageMin,
    age_max: ageMax,
    gender,
    interests,
    locations: [], // We don't extract locations currently
  };
};

/**
 * Call Facebook Campaign Manager edge function
 * 
 * @param action The action to perform
 * @param data The data for the action
 * @returns The response from the edge function
 */
export const callFacebookCampaignManager = async (action: string, data: any) => {
  try {
    const { supabase } = await import('@/integrations/supabase/client');
    
    console.log(`Calling Facebook Campaign Manager with action: ${action}`, data);
    
    const response = await supabase.functions.invoke('facebook-campaign-manager', {
      body: {
        action,
        ...data
      },
    });
    
    console.log(`Response from Facebook Campaign Manager:`, response);
    
    if (response.error) {
      throw new Error(`Edge function error: ${response.error.message}`);
    }
    
    return {
      data: response.data,
      error: null
    };
  } catch (error) {
    console.error("Error calling Facebook Campaign Manager:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Unknown error occurred')
    };
  }
};
