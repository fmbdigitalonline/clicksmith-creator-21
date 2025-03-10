import { Json } from "@/integrations/supabase/types";
import { AdHook, AdImage } from "./adWizard";

export interface SavedAd {
  image: AdImage;
  hook: AdHook;
  rating: number;
  feedback: string;
  savedAt: string;
}

export type SavedAdJson = {
  [K in keyof SavedAd]: Json;
};