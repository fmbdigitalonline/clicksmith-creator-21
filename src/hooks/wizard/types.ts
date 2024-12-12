import { BusinessIdea, TargetAudience, AudienceAnalysis, AdFormat, AdHook } from "@/types/adWizard";
import { Json } from "@/integrations/supabase/types";

export type WizardState = {
  businessIdea: BusinessIdea | null;
  targetAudience: TargetAudience | null;
  audienceAnalysis: AudienceAnalysis | null;
  adFormat: AdFormat | null;
  selectedHooks: AdHook[];
};

export type WizardProgress = {
  business_idea: Json;
  target_audience: Json;
  audience_analysis: Json;
  selected_hooks: Json;
  ad_format: Json;
};

export const parseWizardProgress = (data: WizardProgress): Partial<WizardState> => {
  return {
    businessIdea: data.business_idea as BusinessIdea,
    targetAudience: data.target_audience as TargetAudience,
    audienceAnalysis: data.audience_analysis as AudienceAnalysis,
    selectedHooks: (data.selected_hooks as AdHook[]) || [],
    adFormat: data.ad_format as AdFormat,
  };
};