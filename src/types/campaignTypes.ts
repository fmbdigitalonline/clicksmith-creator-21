
import { Json } from "@/integrations/supabase/types";

export interface SavedAd {
  id: string;
  saved_images: string[];
  headline?: string;
  primary_text?: string;
  rating: number;
  feedback: string;
  created_at: string;
  imageurl?: string;
  imageUrl?: string;
  storage_url?: string;
  original_url?: string;
  image_status?: 'pending' | 'processing' | 'ready' | 'failed';
  platform?: string;
  project_id?: string;
  size?: AdSize;
  fb_ad_settings?: FacebookAdSettings;
}

export interface FacebookAdSettings extends Record<string, Json> {
  website_url: string;
  visible_link: string;
  call_to_action: string;
  ad_language: string;
  url_parameters: string;
  browser_addon: string;
}

export interface AdSize {
  width: number;
  height: number;
  label: string;
}

export interface AdSelectionGalleryProps {
  projectId?: string;
  onAdsSelected: (adIds: string[]) => void;
  selectedAdIds?: string[];
  maxSelection?: number;
}

export interface AdImageWithVariants {
  id: string;
  originalImageUrl: string;
  resizedImageUrls: Record<string, string>;
  projectId?: string;
  prompt?: string;
  metadata?: Record<string, unknown>;
}

export interface Campaign {
  id: string;
  name: string;
  status: string;
  platform: string;
  created_at: string;
  platform_campaign_id?: string | null;
  platform_ad_set_id?: string | null;
  platform_ad_id?: string | null;
  image_url?: string | null;
  targeting?: any;
  campaign_data?: any;
  budget?: number | null;
  end_date?: string | null;
  start_date?: string | null;
  user_id?: string | null;
  project_id?: string | null;
  updated_at?: string | null;
  creation_mode?: string;
  template_id?: string | null;
  template_name?: string | null;
  is_template?: boolean;
  performance_metrics?: any;
  last_synced_at?: string | null;
}

export interface AdCampaignData {
  id: string;
  name: string;
  platform: string;
  status: string;
  platform_campaign_id?: string;
  platform_ad_set_id?: string;
  platform_ad_id?: string;
  campaign_data?: Record<string, unknown>;
  image_url?: string;
  project_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CampaignFormData {
  name: string;
  objective: string;
  budget: number;
  bid_amount?: number;
  bid_strategy: string;
  end_date?: Date;
  start_date: Date;
  targeting?: {
    age_min: number;
    age_max: number;
    gender: string;
    interests?: string[];
    locations?: string[];
  };
  additional_notes?: string;
}

export interface FacebookCampaignOverviewProps {
  onConnectionChange?: () => Promise<void>;
}

export interface CampaignFormRef {
  submitForm: () => Promise<boolean>;
}
