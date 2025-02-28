
import { supabase } from "@/integrations/supabase/client";

export interface FacebookCampaignData {
  campaignName: string;
  objective: string;
  status: string;
  budget: number;
  startDate?: string;
  endDate?: string;
  targeting?: Record<string, any>;
}

export interface FacebookAdsetData {
  name: string;
  billingEvent: string;
  dailyBudget: number;
  optimizationGoal: string;
  status: string;
  targeting: Record<string, any>;
}

export interface FacebookCreativeData {
  name: string;
  pageId: string;
  primaryText: string;
  headline: string;
  description: string;
  websiteUrl: string;
  imageUrl?: string;
  callToAction?: string;
  status: string;
}

export const facebookAdsService = {
  // Connect to Facebook
  getAuthUrl: async (): Promise<string> => {
    try {
      const { data, error } = await supabase.functions.invoke('facebook-auth', {
        body: { action: 'redirect' }
      });

      if (error) throw error;
      return data.url;
    } catch (error) {
      console.error('Error getting Facebook auth URL:', error);
      throw error;
    }
  },

  // Handle OAuth callback
  handleCallback: async (code: string): Promise<any> => {
    try {
      const { data, error } = await supabase.functions.invoke('facebook-auth', {
        body: { action: 'callback', code }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error handling Facebook callback:', error);
      throw error;
    }
  },

  // Get user's Facebook connections
  getConnections: async (): Promise<any> => {
    try {
      const { data, error } = await supabase.functions.invoke('facebook-auth', {
        body: { action: 'get-connections' }
      });

      if (error) throw error;
      return data.connections;
    } catch (error) {
      console.error('Error getting Facebook connections:', error);
      throw error;
    }
  },

  // Create campaign
  createCampaign: async (projectId: string, campaignData: FacebookCampaignData): Promise<any> => {
    try {
      const { data, error } = await supabase.functions.invoke('facebook-ads', {
        body: {
          action: 'create-campaign',
          projectId,
          adData: campaignData
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating Facebook campaign:', error);
      throw error;
    }
  },

  // Create ad set
  createAdset: async (projectId: string, campaignId: string, adsetData: FacebookAdsetData): Promise<any> => {
    try {
      const { data, error } = await supabase.functions.invoke('facebook-ads', {
        body: {
          action: 'create-adset',
          projectId,
          adData: {
            campaignId,
            adsetData
          }
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating Facebook ad set:', error);
      throw error;
    }
  },

  // Create ad
  createAd: async (projectId: string, adsetId: string, creativeData: FacebookCreativeData): Promise<any> => {
    try {
      const { data, error } = await supabase.functions.invoke('facebook-ads', {
        body: {
          action: 'create-ad',
          projectId,
          adData: {
            adsetId,
            creativeData
          }
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating Facebook ad:', error);
      throw error;
    }
  },

  // Get all campaigns
  getCampaigns: async (): Promise<any> => {
    try {
      const { data, error } = await supabase.functions.invoke('facebook-ads', {
        body: {
          action: 'get-campaigns'
        }
      });

      if (error) throw error;
      return data.campaigns;
    } catch (error) {
      console.error('Error getting Facebook campaigns:', error);
      throw error;
    }
  },
};
