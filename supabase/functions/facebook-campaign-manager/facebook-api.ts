export class FacebookAPI {
  private accessToken: string;
  private adAccountId: string;

  constructor(accessToken: string, adAccountId: string) {
    this.accessToken = accessToken;
    this.adAccountId = adAccountId;
  }

  async createCampaign(name: string, objective: string, budget: number, bidStrategy: string, bidAmount: number, startDate: Date, endDate?: Date): Promise<string> {
    const url = `https://graph.facebook.com/v18.0/act_${this.adAccountId}/campaigns`;
    const params = {
      name: name,
      objective: objective,
      status: 'PAUSED',
      special_ad_categories: [],
      buying_type: 'AUCTION',
      access_token: this.accessToken
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    const data = await response.json();

    if (data.error) {
      console.error("Error creating campaign:", data.error);
      throw new Error(`Facebook API Error: ${data.error.message}`);
    }

    return data.id;
  }

  async createAdSet(campaignId: string, name: string, budget: number, optimizationGoal: string, targeting: any, bidStrategy: string, bidAmount: number, startDate: Date, endDate?: Date): Promise<any> {
    const url = `https://graph.facebook.com/v18.0/act_${this.adAccountId}/adsets`;

    // Format targeting data for Facebook API
    const formattedTargeting = {
      age_min: targeting?.age_min || 18,
      age_max: targeting?.age_max || 65,
      genders: (targeting?.gender === 'MALE') ? [1] : (targeting?.gender === 'FEMALE') ? [2] : [],
      interests: targeting?.interests ? targeting.interests.map(interest => ({ id: interest, name: interest })) : [],
      geo_locations: {
        [targeting?.locations && targeting.locations.length > 0 ? targeting.locations[0].key : 'countries']:
          targeting?.locations && targeting.locations.length > 0 ? targeting.locations[0].value : ['US']
      }
    };

    const params = {
      name: name,
      campaign_id: campaignId,
      status: 'PAUSED',
      optimization_goal: optimizationGoal,
      targeting: formattedTargeting,
      billing_event: 'IMPRESSIONS',
      bid_strategy: bidStrategy,
      daily_budget: Math.round(budget),
      start_time: startDate.toISOString().slice(0, 10),
      end_time: endDate ? endDate.toISOString().slice(0, 10) : null,
      access_token: this.accessToken
    };

    if (bidAmount > 0 && bidStrategy !== 'LOWEST_COST_WITHOUT_CAP') {
      params['bid_amount'] = Math.round(bidAmount * 100); // Bid amount in cents
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    const data = await response.json();

    if (data.error) {
      console.error("Error creating ad set:", data.error);
      throw new Error(`Facebook API Error: ${data.error.message}`);
    }

    return data;
  }

  async createAd(adSetId: string, name: string, headline: string, body: string, imageUrl: string, additionalNotes: string | null): Promise<any> {
    // Create ad creative
    const creative = await this.createFacebookAdCreative(name, headline, body, imageUrl);

    const url = `https://graph.facebook.com/v18.0/act_${this.adAccountId}/ads`;
    const params = {
      name: name,
      adset_id: adSetId,
      status: 'PAUSED',
      creative: { creative_id: creative.id },
      access_token: this.accessToken
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    const data = await response.json();

    if (data.error) {
      console.error("Error creating ad:", data.error);
      throw new Error(`Facebook API Error: ${data.error.message}`);
    }

    return data;
  }

  async createFacebookAdCreative(name: string, headline: string, body: string, imageUrl: string): Promise<any> {
    const url = `https://graph.facebook.com/v18.0/act_${this.adAccountId}/adcreatives`;

    // Check if the image URL is accessible
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      if (!response.ok) {
        console.error(`Image URL check failed with status: ${response.status}`);
        throw new Error(`Image URL ${imageUrl} is not accessible`);
      }
    } catch (error) {
      console.error("Error checking image URL:", error);
      throw error;
    }

    const params = {
      name: name,
      object_story_spec: {
        page_id: this.adAccountId,
        link_data: {
          link: 'https://www.google.com', // Replace with your actual URL
          image_url: imageUrl,
          message: body,
          call_to_action: {
            type: 'LEARN_MORE',
            value: {
              link: 'https://www.google.com' // Replace with your actual URL
            }
          },
          caption: 'google.com', // Replace with your actual caption
          description: body,
          headline: headline
        }
      },
      access_token: this.accessToken
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    const data = await response.json();

    if (data.error) {
      console.error("Error creating ad creative:", data.error);
      throw new Error(`Facebook API Error: ${data.error.message}`);
    }

    return data;
  }

  async getAdAccounts(): Promise<any> {
    const url = `https://graph.facebook.com/v18.0/me/adaccounts?access_token=${this.accessToken}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("Error getting ad accounts:", data.error);
      throw new Error(`Facebook API Error: ${data.error.message}`);
    }

    return data.data;
  }

  async getAdAccount(adAccountId: string): Promise<any> {
    const url = `https://graph.facebook.com/v18.0/${adAccountId}?fields=name,account_id&access_token=${this.accessToken}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("Error getting ad account:", data.error);
      throw new Error(`Facebook API Error: ${data.error.message}`);
    }

    return data;
  }

  async getCampaigns(): Promise<any> {
    const url = `https://graph.facebook.com/v18.0/act_${this.adAccountId}/campaigns?fields=id,name,objective,status&access_token=${this.accessToken}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("Error getting campaigns:", data.error);
      throw new Error(`Facebook API Error: ${data.error.message}`);
    }

    return data.data;
  }

  async getCampaign(campaignId: string): Promise<any> {
    const url = `https://graph.facebook.com/v18.0/${campaignId}?fields=id,name,objective,status&access_token=${this.accessToken}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("Error getting campaign:", data.error);
      throw new Error(`Facebook API Error: ${data.error.message}`);
    }

    return data;
  }

  async updateCampaign(campaignId: string, campaignData: any): Promise<any> {
    const url = `https://graph.facebook.com/v18.0/${campaignId}?access_token=${this.accessToken}`;
    const params = {
      name: campaignData.name,
      objective: campaignData.objective,
      status: campaignData.status
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    const data = await response.json();

    if (data.error) {
      console.error("Error updating campaign:", data.error);
      throw new Error(`Facebook API Error: ${data.error.message}`);
    }

    return data;
  }

  async deleteCampaign(campaignId: string): Promise<any> {
    const url = `https://graph.facebook.com/v18.0/${campaignId}?access_token=${this.accessToken}`;
    const params = {
      status: 'DELETED'
    };

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    const data = await response.json();

    if (data.error) {
      console.error("Error deleting campaign:", data.error);
      throw new Error(`Facebook API Error: ${data.error.message}`);
    }

    return data;
  }

  async getInsights(campaignId: string, timeRange: any): Promise<any> {
    const url = `https://graph.facebook.com/v18.0/${campaignId}/insights?fields=impressions,reach,spend&time_range[since]=${timeRange.since}&time_range[until]=${timeRange.until}&access_token=${this.accessToken}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("Error getting insights:", data.error);
      throw new Error(`Facebook API Error: ${data.error.message}`);
    }

    return data.data;
  }
}

// Add a helper method to check if an image URL is accessible
export async function isImageUrlAccessible(url: string): Promise<boolean> {
  try {
    console.log(`Checking image URL accessibility: ${url}`);
    const response = await fetch(url, { method: 'HEAD' });
    const isAccessible = response.ok;
    console.log(`Image URL check result: ${isAccessible ? 'accessible' : 'not accessible'} (status: ${response.status})`);
    return isAccessible;
  } catch (error) {
    console.error(`Error checking image URL: ${error.message}`);
    return false;
  }
}

// Add a helper method to validate all image URLs in ad details
export async function validateAdImages(adDetails: any[]): Promise<{ valid: boolean; message?: string }> {
  if (!adDetails || !Array.isArray(adDetails) || adDetails.length === 0) {
    return { valid: false, message: "No ad details provided" };
  }

  for (const ad of adDetails) {
    // Use storage_url preferentially, then fall back to other URL fields
    const imageUrl = ad.storage_url || ad.imageUrl || ad.imageurl;
    
    if (!imageUrl) {
      return { 
        valid: false, 
        message: `Ad ${ad.id} is missing an image URL. Please ensure all ads have processed images.` 
      };
    }
    
    // Skip URL validation for images that are known to be in our storage
    // These will have URLs starting with our domain or containing /storage/
    if (imageUrl.includes('/storage/') || imageUrl.startsWith(Deno.env.get('SUPABASE_URL') || '')) {
      console.log(`Using validated storage URL: ${imageUrl}`);
      continue;
    }
    
    // For external URLs, check if they're accessible
    const isAccessible = await isImageUrlAccessible(imageUrl);
    
    if (!isAccessible) {
      return { 
        valid: false, 
        message: `Image URL ${imageUrl} is not accessible. Please ensure all images are processed before creating a campaign.` 
      };
    }
  }

  return { valid: true };
}
