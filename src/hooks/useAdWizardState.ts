import { useState, useEffect } from "react";
import {
  BusinessIdea,
  TargetAudience,
  AudienceAnalysis,
  AdFormat,
  AdHook
} from "@/types/adWizard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export const useAdWizardState = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [businessIdea, setBusinessIdea] = useState<BusinessIdea | null>(null);
  const [targetAudience, setTargetAudience] = useState<TargetAudience | null>(null);
  const [audienceAnalysis, setAudienceAnalysis] = useState<AudienceAnalysis | null>(null);
  const [adFormat, setAdFormat] = useState<AdFormat | null>(null);
  const [selectedHooks, setSelectedHooks] = useState<AdHook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load saved progress when component mounts
  useEffect(() => {
    loadSavedProgress();
  }, []);

  const loadSavedProgress = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('wizard_progress')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading progress:', error);
        return;
      }

      if (data) {
        if (data.business_idea) setBusinessIdea(data.business_idea);
        if (data.target_audience) setTargetAudience(data.target_audience);
        if (data.audience_analysis) setAudienceAnalysis(data.audience_analysis);
        if (data.selected_hooks) setSelectedHooks(data.selected_hooks);
        if (data.ad_format) setAdFormat(data.ad_format);

        // Set the appropriate step based on the loaded data
        let step = 1;
        if (data.business_idea) step = 2;
        if (data.target_audience) step = 3;
        if (data.audience_analysis) step = 4;
        if (data.selected_hooks?.length > 0) step = 5;
        if (data.ad_format) step = 6;
        setCurrentStep(step);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveProgress = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('wizard_progress')
        .upsert({
          user_id: session.user.id,
          business_idea: businessIdea,
          target_audience: targetAudience,
          audience_analysis: audienceAnalysis,
          selected_hooks: selectedHooks,
          ad_format: adFormat,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving progress:', error);
      toast({
        title: "Error",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleIdeaSubmit = async (idea: BusinessIdea) => {
    setBusinessIdea(idea);
    setCurrentStep(2);
    await saveProgress();
  };

  const handleAudienceSelect = async (audience: TargetAudience) => {
    setTargetAudience(audience);
    setCurrentStep(3);
    await saveProgress();
  };

  const handleAnalysisComplete = async (analysis: AudienceAnalysis) => {
    setAudienceAnalysis(analysis);
    setCurrentStep(4);
    await saveProgress();
  };

  const handleHookSelect = async (hooks: AdHook[]) => {
    setSelectedHooks(hooks);
    setCurrentStep(5);
    await saveProgress();
  };

  const handleFormatSelect = async (format: AdFormat) => {
    setAdFormat(format);
    setCurrentStep(6);
    await saveProgress();
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleStartOver = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Delete all progress records for this user
        const { error } = await supabase
          .from('wizard_progress')
          .delete()
          .eq('user_id', session.user.id);

        if (error) throw error;
      }

      // Reset all state
      setBusinessIdea(null);
      setTargetAudience(null);
      setAudienceAnalysis(null);
      setAdFormat(null);
      setSelectedHooks([]);
      setCurrentStep(1);

      toast({
        title: "Progress Reset",
        description: "Your progress has been cleared. You can start fresh now.",
      });
    } catch (error) {
      console.error('Error clearing progress:', error);
      toast({
        title: "Error",
        description: "Failed to clear your progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const canNavigateToStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return true;
      case 2:
        return !!businessIdea;
      case 3:
        return !!businessIdea && !!targetAudience;
      case 4:
        return !!businessIdea && !!targetAudience && !!audienceAnalysis;
      case 5:
        return !!businessIdea && !!targetAudience && !!audienceAnalysis && selectedHooks.length > 0;
      case 6:
        return !!businessIdea && !!targetAudience && !!audienceAnalysis && selectedHooks.length > 0 && !!adFormat;
      default:
        return false;
    }
  };

  return {
    currentStep,
    businessIdea,
    targetAudience,
    audienceAnalysis,
    adFormat,
    selectedHooks,
    isLoading,
    handleIdeaSubmit,
    handleAudienceSelect,
    handleAnalysisComplete,
    handleHookSelect,
    handleFormatSelect,
    handleBack,
    handleStartOver,
    canNavigateToStep,
    setCurrentStep,
  };
};

export default useAdWizardState;