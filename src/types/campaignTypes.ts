
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
  platform?: string;
  project_id?: string;
  size?: AdSize;
}

// Define SavedAdJson explicitly rather than using an alias
export interface SavedAdJson extends SavedAd {
  // Additional fields specific to JSON representation can be added here if needed
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

export interface CampaignFormValues {
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

export interface CampaignFormRef {
  submitForm: () => Promise<boolean>;
  getFormValues: () => CampaignFormValues;
  setFormValues: (values: Partial<CampaignFormValues>) => void;
}
