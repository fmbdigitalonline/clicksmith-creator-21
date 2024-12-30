import { useState, useCallback } from "react";
import {
  BusinessIdea,
  TargetAudience,
  AudienceAnalysis,
  AdHook,
  AdFormat,
  MarketingCampaign,
  AdImage,
} from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";

export const useAdWizardState = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [businessIdea, setBusinessIdea] = useState<BusinessIdea | null>(null);
  const [targetAudience, setTargetAudience] = useState<TargetAudience | null>(null);
  const [audienceAnalysis, setAudienceAnalysis] = useState<AudienceAnalysis | null>(null);
  const [selectedHooks, setSelectedHooks] = useState<AdHook[]>([]);
  const [adFormat, setAdFormat] = useState<AdFormat | null>(null);
  const [videoAdPreferences, setVideoAdPreferences] = useState<any>(null);
  const [adDimensions, setAdDimensions] = useState<any>(null);
  const [videoAdsEnabled, setVideoAdsEnabled] = useState<boolean>(false);
  const [marketingCampaign, setMarketingCampaign] = useState<MarketingCampaign | null>(null);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const { toast } = useToast();
  const { projectId } = useParams();

  const saveProgress = async (data: any) => {
    if (!autoSaveEnabled) return;
    
    try {
      if (projectId) {
        const { error } = await supabase
          .from('projects')
          .update(data)
          .eq('id', projectId);

        if (error) throw error;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
          .from('wizard_progress')
          .upsert({
            user_id: user.id,
            ...data,
          });

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving progress:', error);
      toast({
        title: "Error saving progress",
        description: error instanceof Error ? error.message : "Failed to save progress",
        variant: "destructive",
      });
    }
  };

  const handleIdeaSubmit = useCallback(async (idea: BusinessIdea) => {
    setBusinessIdea(idea);
    await saveProgress({ business_idea: idea });
    setCurrentStep(2);
  }, [autoSaveEnabled]);

  const handleAudienceSelect = useCallback(async (audience: TargetAudience) => {
    setTargetAudience(audience);
    await saveProgress({ target_audience: audience });
    setCurrentStep(3);
  }, [autoSaveEnabled]);

  const handleAnalysisComplete = useCallback(async (analysis: AudienceAnalysis) => {
    try {
      setAudienceAnalysis(analysis);
      await saveProgress({ audience_analysis: analysis });

      const { data, error } = await supabase.functions.invoke('generate-ad-content', {
        body: { 
          type: 'hooks',
          businessIdea,
          targetAudience: {
            ...targetAudience,
            audienceAnalysis: analysis
          }
        }
      });

      if (error) {
        toast({
          title: "Error generating hooks",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data?.hooks && Array.isArray(data.hooks)) {
        setSelectedHooks(data.hooks);
        await saveProgress({ selected_hooks: data.hooks });
        setCurrentStep(4);
      } else {
        throw new Error('Invalid hooks data received');
      }
    } catch (error) {
      console.error('Error in handleAnalysisComplete:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate hooks",
        variant: "destructive",
      });
    }
  }, [businessIdea, targetAudience, toast, autoSaveEnabled]);

  const handleBack = useCallback(() => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  }, []);

  const handleStartOver = useCallback(async () => {
    setBusinessIdea(null);
    setTargetAudience(null);
    setAudienceAnalysis(null);
    setSelectedHooks([]);
    setCurrentStep(1);

    if (autoSaveEnabled) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
          .from('wizard_progress')
          .delete()
          .eq('user_id', user.id);

        if (error) throw error;
      } catch (error) {
        console.error('Error clearing progress:', error);
      }
    }
  }, [autoSaveEnabled]);

  const handleHooksSelect = useCallback(async (hooks: AdHook[]) => {
    setSelectedHooks(hooks);
    await saveProgress({ selected_hooks: hooks });
    setCurrentStep(5);
  }, [autoSaveEnabled]);

  const handleAdFormatSelect = useCallback(async (format: AdFormat) => {
    setAdFormat(format);
    await saveProgress({ ad_format: format });
    setCurrentStep(6);
  }, [autoSaveEnabled]);

  const handleVideoPreferencesUpdate = useCallback(async (preferences: any) => {
    setVideoAdPreferences(preferences);
    await saveProgress({ video_ad_preferences: preferences });
  }, [autoSaveEnabled]);

  const handleAdDimensionsUpdate = useCallback(async (dimensions: any) => {
    setAdDimensions(dimensions);
    await saveProgress({ ad_dimensions: dimensions });
    setCurrentStep(7);
  }, [autoSaveEnabled]);

  const handleVideoAdsToggle = useCallback(async (enabled: boolean) => {
    setVideoAdsEnabled(enabled);
    await saveProgress({ video_ads_enabled: enabled });
  }, [autoSaveEnabled]);

  const handleCampaignComplete = useCallback(async (campaign: any) => {
    setMarketingCampaign(campaign);
    await saveProgress({ marketing_campaign: campaign });
    setCurrentStep(8);
  }, [autoSaveEnabled]);

  const handleCreateProject = useCallback(async () => {
    // Implementation for project creation
    setCurrentStep(9);
  }, []);

  const handleGeneratedImages = useCallback(async (images: AdImage[]) => {
    // Store the generated images and move to the next step
    await saveProgress({ generated_ads: images });
    setCurrentStep(6);
  }, []);

  const canNavigateToStep = useCallback((step: number): boolean => {
    switch (step) {
      case 1:
        return true;
      case 2:
        return !!businessIdea;
      case 3:
        return !!businessIdea && !!targetAudience;
      case 4:
        return !!businessIdea && !!targetAudience && !!audienceAnalysis && selectedHooks.length > 0;
      default:
        return false;
    }
  }, [businessIdea, targetAudience, audienceAnalysis, selectedHooks]);

  return {
    currentStep,
    businessIdea,
    targetAudience,
    audienceAnalysis,
    selectedHooks,
    adFormat,
    videoAdPreferences,
    adDimensions,
    videoAdsEnabled,
    marketingCampaign,
    autoSaveEnabled,
    setAutoSaveEnabled,
    handleIdeaSubmit,
    handleAudienceSelect,
    handleAnalysisComplete,
    handleBack,
    handleStartOver,
    handleHooksSelect,
    handleAdFormatSelect,
    handleVideoPreferencesUpdate,
    handleAdDimensionsUpdate,
    handleVideoAdsToggle,
    handleCampaignComplete,
    handleCreateProject,
    handleGeneratedImages,
    canNavigateToStep,
    setCurrentStep,
  };
};

export default useAdWizardState;
