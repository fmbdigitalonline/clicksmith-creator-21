
import { BusinessIdea, TargetAudience } from "@/types/adWizard";

interface AdVariant {
  headline: string;
  description: string;
  imageUrl: string;
  callToAction: string;
}

/**
 * Transforms business data into Facebook-compatible ad format
 */
export const transformToFacebookAdFormat = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  adVariant: AdVariant,
  budget: number,
  landingPageUrl: string
) => {
  // Convert budget to cents (Facebook requires budget in cents)
  const budgetInCents = Math.round(budget * 100);
  
  // Create campaign data
  const campaignData = {
    name: `Campaign for ${businessIdea.description?.substring(0, 40) || 'Business'}`,
    objective: "CONVERSIONS",
    status: "PAUSED", // Start paused so the user can review
    special_ad_categories: []
  };
  
  // Parse demographics
  const demographics = targetAudience.demographics || "";
  let ageMin = 18;
  let ageMax = 65;
  let genders = [0]; // 0 = all, 1 = men, 2 = women
  
  if (demographics) {
    // Try to extract age range
    const ageMatch = demographics.match(/(\d+)-(\d+)/);
    if (ageMatch) {
      ageMin = parseInt(ageMatch[1], 10);
      ageMax = parseInt(ageMatch[2], 10);
    }
    
    // Try to extract gender
    if (demographics.toLowerCase().includes("men") && !demographics.toLowerCase().includes("women")) {
      genders = [1]; // men only
    } else if (demographics.toLowerCase().includes("women") && !demographics.toLowerCase().includes("men")) {
      genders = [2]; // women only
    }
  }
  
  // Parse location targeting
  let countries = ["US"];
  if (demographics.includes("US") || 
      demographics.toLowerCase().includes("united states") || 
      demographics.toLowerCase().includes("america")) {
    countries = ["US"];
  } else if (demographics.includes("UK") || demographics.toLowerCase().includes("united kingdom")) {
    countries = ["GB"];
  } else if (demographics.toLowerCase().includes("canada")) {
    countries = ["CA"];
  } else if (demographics.toLowerCase().includes("australia")) {
    countries = ["AU"];
  }
  
  // Create ad set data
  const adSetData = {
    name: `Ad Set for ${businessIdea.description?.substring(0, 40) || 'Business'}`,
    daily_budget: budgetInCents,
    billing_event: "IMPRESSIONS",
    optimization_goal: "REACH",
    bid_amount: 500, // $5.00 in cents
    status: "PAUSED",
    targeting: {
      age_min: ageMin,
      age_max: ageMax,
      genders: genders,
      geo_locations: {
        countries: countries
      },
      flexible_spec: [
        {
          interests: [
            { id: "6003139266461", name: "Shopping" } // Default fallback interest
          ]
        }
      ]
    }
  };
  
  // Create ad creative data
  const adCreativeData = {
    name: `Creative for ${businessIdea.description?.substring(0, 40) || 'Business'}`,
    object_story_spec: {
      page_id: "{{page_id}}", // This will be replaced at runtime with the user's page
      link_data: {
        message: adVariant.description || businessIdea.valueProposition,
        link: landingPageUrl,
        name: adVariant.headline || businessIdea.description,
        description: businessIdea.valueProposition,
        image_url: adVariant.imageUrl,
        call_to_action: {
          type: adVariant.callToAction
        }
      }
    }
  };
  
  return {
    campaign: campaignData,
    adSet: adSetData,
    adCreative: adCreativeData
  };
};
