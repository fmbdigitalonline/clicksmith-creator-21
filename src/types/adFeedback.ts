
import { Json } from "@/integrations/supabase/types";

export interface AdFeedback {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  headline: string;
  feedback: string;
  rating: number;
  ad_id?: string;
  browser_addons?: Json;
  call_to_action?: string;
  created_by?: string;
  fb_ad_settings?: Json;
  fb_language?: string;
  image_url?: string;
  imageUrl?: string;
  imageurl?: string;
  primary_text?: string;
  website_url?: string;
}
