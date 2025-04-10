
// Adding FacebookAdSettings interface - make sure this file exists and is properly importing/exporting if it already exists
export interface FacebookAdSettings {
  website_url: string;
  visible_link: string;
  call_to_action: string;
  ad_language: string;
  url_parameters?: string;
  browser_addon?: string;
}

// Add the missing types that are being imported in AdSelectionGallery.tsx
export interface AdSize {
  width: number;
  height: number;
  label: string;
}

export interface SavedAd {
  id: string;
  headline?: string;
  primary_text?: string;
  rating: number;
  feedback: string;
  created_at: string;
  imageUrl?: string;
  imageurl?: string;
  storage_url?: string;
  platform?: string;
  size?: AdSize;
  project_id?: string;
  saved_images?: string[];
  image_status?: 'pending' | 'processing' | 'ready' | 'failed';
  media_type?: 'image' | 'video';
  file_type?: string;
  fb_ad_settings?: FacebookAdSettings;
}

export interface AdSelectionGalleryProps {
  projectId?: string;
  onAdsSelected: (adIds: string[]) => void;
  selectedAdIds?: string[];
  maxSelection?: number;
}

// Add missing Campaign type for FacebookCampaignOverview.tsx
export interface Campaign {
  id: string;
  name: string;
  status: string;
  platform: string;
  budget?: number;
  start_date?: string;
  end_date?: string;
  targeting?: any;
  campaign_data?: any;
  performance_metrics?: any;
}

export interface FacebookCampaignOverviewProps {
  campaign: Campaign;
  onRefresh?: () => void;
}
