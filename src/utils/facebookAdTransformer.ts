
import { BusinessIdea, TargetAudience } from "@/types/adWizard";

interface FacebookAdCreative {
  name: string;
  object_story_spec: {
    page_id: string;
    link_data: {
      image_hash?: string;
      image_url?: string;
      link: string;
      message: string;
      name: string;
      description?: string;
      call_to_action: {
        type: string;
        value: {
          link: string;
        };
      };
    };
  };
}

interface FacebookTargeting {
  age_min: number;
  age_max: number;
  genders?: number[];
  geo_locations?: {
    countries?: string[];
    regions?: Array<{ key: string }>;
    cities?: Array<{ key: string }>;
  };
  interests?: Array<{ id: string; name: string }>;
  behaviors?: Array<{ id: string; name: string }>;
  life_events?: Array<{ id: string; name: string }>;
  exclusions?: {
    interests?: Array<{ id: string; name: string }>;
  };
}

interface FacebookAdSet {
  name: string;
  optimization_goal: string;
  billing_event: string;
  bid_amount: number;
  daily_budget: number;
  targeting: FacebookTargeting;
  status: string;
}

interface FacebookCampaign {
  name: string;
  objective: string;
  status: string;
  special_ad_categories?: string[];
}

export interface FacebookAdData {
  campaign: FacebookCampaign;
  adSet: FacebookAdSet;
  adCreative: FacebookAdCreative;
}

/**
 * Transforms demographic information into Facebook targeting parameters
 */
const transformDemographics = (demographics: string): Partial<FacebookTargeting> => {
  const targeting: Partial<FacebookTargeting> = {
    age_min: 18,
    age_max: 65,
  };

  // Extract age information
  const ageRegex = /(\d+)[-\s]*(to|\+)?[-\s]*(\d+)?/;
  const ageMatch = demographics.match(ageRegex);
  if (ageMatch) {
    targeting.age_min = parseInt(ageMatch[1], 10);
    if (ageMatch[3]) {
      targeting.age_max = parseInt(ageMatch[3], 10);
    } else if (ageMatch[2] === '+') {
      targeting.age_max = 65;
    }
  }

  // Extract gender information
  if (demographics.toLowerCase().includes('female') && !demographics.toLowerCase().includes('male')) {
    targeting.genders = [1]; // 1 for female
  } else if (demographics.toLowerCase().includes('male') && !demographics.toLowerCase().includes('female')) {
    targeting.genders = [2]; // 2 for male
  }

  // Extract location information (very basic)
  const countries: string[] = [];
  ['us', 'usa', 'united states', 'canada', 'uk', 'united kingdom', 'australia'].forEach(country => {
    if (demographics.toLowerCase().includes(country)) {
      if (country === 'us' || country === 'usa' || country === 'united states') {
        countries.push('US');
      } else if (country === 'canada') {
        countries.push('CA');
      } else if (country === 'uk' || country === 'united kingdom') {
        countries.push('GB');
      } else if (country === 'australia') {
        countries.push('AU');
      }
    }
  });

  if (countries.length > 0) {
    targeting.geo_locations = {
      countries,
    };
  }

  return targeting;
};

/**
 * Transform pain points into Facebook targeting interests
 * This is a simplified version - in a real app, you'd use Facebook's Marketing API
 * to look up actual interest IDs
 */
const extractInterestsFromPainPoints = (painPoints: string[]): Array<{ id: string; name: string }> => {
  // This is a mock function - in reality, you would use Facebook's API to find relevant interest IDs
  // These IDs are placeholders and won't work in actual API calls
  const mockInterestMapping: Record<string, { id: string; name: string }> = {
    'time': { id: '6003349442923', name: 'Time management' },
    'money': { id: '6003055742123', name: 'Personal finance' },
    'stress': { id: '6003139266982', name: 'Stress management' },
    'health': { id: '6003123958419', name: 'Health & wellness' },
    'weight': { id: '6003107902431', name: 'Weight loss' },
    'fitness': { id: '6003135523097', name: 'Fitness' },
    'productivity': { id: '6003192076936', name: 'Productivity' },
    'social': { id: '6003178212754', name: 'Social networking' },
  };

  const interests: Array<{ id: string; name: string }> = [];
  
  painPoints.forEach(point => {
    const keywords = point.toLowerCase().split(' ');
    
    keywords.forEach(keyword => {
      Object.keys(mockInterestMapping).forEach(key => {
        if (keyword.includes(key) && !interests.some(i => i.id === mockInterestMapping[key].id)) {
          interests.push(mockInterestMapping[key]);
        }
      });
    });
  });

  return interests;
};

/**
 * Transform business idea and targeting data into Facebook ad format
 */
export const transformToFacebookAdFormat = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  adVariant: any,
  budget = 5, // Daily budget in USD
  landingPageUrl = 'https://example.com', // Default landing page URL
): FacebookAdData => {
  // Create Facebook campaign data
  const campaign: FacebookCampaign = {
    name: `${businessIdea.description.substring(0, 40)} - Campaign`,
    objective: 'CONVERSIONS', // Common objectives: AWARENESS, CONVERSIONS, TRAFFIC
    status: 'PAUSED', // Start as paused so the user can review before launching
  };

  // Create demographic targeting
  const demographicTargeting = transformDemographics(targetAudience.demographics);
  
  // Create interest targeting from pain points
  const interests = extractInterestsFromPainPoints(targetAudience.painPoints);

  // Create Facebook ad set data
  const adSet: FacebookAdSet = {
    name: `${targetAudience.name.substring(0, 40)} - Ad Set`,
    optimization_goal: 'CONVERSIONS', // What you're optimizing for
    billing_event: 'IMPRESSIONS', // How you're billed: IMPRESSIONS or LINK_CLICKS
    bid_amount: 10, // Maximum bid in cents
    daily_budget: budget * 100, // Budget in cents
    targeting: {
      ...demographicTargeting,
      interests: interests,
    } as FacebookTargeting,
    status: 'PAUSED',
  };

  // Create Facebook ad creative data
  const adCreative: FacebookAdCreative = {
    name: adVariant.headline || `Ad for ${businessIdea.description.substring(0, 30)}`,
    object_story_spec: {
      page_id: '{{page_id}}', // This will be replaced with the actual page ID
      link_data: {
        image_url: adVariant.imageUrl,
        link: landingPageUrl,
        message: adVariant.description || businessIdea.valueProposition,
        name: adVariant.headline || businessIdea.description.substring(0, 40),
        call_to_action: {
          type: 'LEARN_MORE', // Button text
          value: {
            link: landingPageUrl,
          },
        },
      },
    },
  };

  // Validate data against Facebook requirements
  validateFacebookAdData(campaign, adSet, adCreative);

  return {
    campaign,
    adSet,
    adCreative,
  };
};

/**
 * Validates the generated Facebook ad data against Facebook's requirements
 */
const validateFacebookAdData = (
  campaign: FacebookCampaign,
  adSet: FacebookAdSet,
  adCreative: FacebookAdCreative
): void => {
  // These are simplified validations. Facebook has many more requirements.
  
  // Campaign validations
  if (!campaign.name || campaign.name.length > 255) {
    console.warn('Campaign name is missing or too long (max 255 characters)');
  }

  // Ad set validations
  if (!adSet.name || adSet.name.length > 255) {
    console.warn('Ad set name is missing or too long (max 255 characters)');
  }
  
  if (adSet.daily_budget < 100) {
    console.warn('Daily budget must be at least $1.00 (100 cents)');
  }

  // Creative validations
  if (!adCreative.object_story_spec.link_data.image_url && !adCreative.object_story_spec.link_data.image_hash) {
    console.warn('Ad creative must have either an image URL or image hash');
  }
  
  if (!adCreative.object_story_spec.link_data.name || adCreative.object_story_spec.link_data.name.length > 40) {
    console.warn('Ad headline is missing or too long (max 40 characters)');
  }
  
  if (adCreative.object_story_spec.link_data.message && adCreative.object_story_spec.link_data.message.length > 125) {
    console.warn('Ad description is too long (max 125 characters)');
  }
};
