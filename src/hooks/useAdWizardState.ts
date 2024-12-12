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
import { useWizardStorage } from "./wizard/useWizardStorage";

export const useAdWizardState = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [businessIdea, setBusinessIdea] = useState<BusinessIdea | null>(null);
  const [targetAudience, setTargetAudience] = useState<TargetAudience | null>(null);
  const [audienceAnalysis, setAudienceAnalysis] = useState<AudienceAnalysis | null>(null);
  const [adFormat, setAdFormat] = useState<AdFormat | null>(null);
  const [selectedHooks, setSelectedHooks] = useState<AdHook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const { toast } = useToast();
  const { loadProgress, saveProgress, clearProgress } = useWizardStorage();

  useEffect(() => {
    const init = async () => {
      try {
        const progress = await loadProgress();
        if (progress) {
          if (progress.businessIdea) setBusinessIdea(progress.businessIdea);
          if (progress.targetAudience) setTargetAudience(progress.targetAudience);
          if (progress.audienceAnalysis) setAudienceAnalysis(progress.audienceAnalysis);
          if (progress.selectedHooks) setSelectedHooks(progress.selectedHooks);
          if (progress.adFormat) setAdFormat(progress.adFormat);

          // Set the appropriate step based on the loaded data
          let step = 1;
          if (progress.businessIdea) step = 2;
          if (progress.targetAudience) step = 3;
          if (progress.audienceAnalysis) step = 4;
          if (progress.selectedHooks?.length > 0) step = 5;
          if (progress.adFormat) step = 6;
          setCurrentStep(step);
        }
      } catch (error) {
        console.error('Error initializing:', error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const handleIdeaSubmit = async (idea: BusinessIdea) => {
    setBusinessIdea(idea);
    setCurrentStep(2);
    await saveProgress({ businessIdea: idea });
  };

  const handleAudienceSelect = async (audience: TargetAudience) => {
    setTargetAudience(audience);
    setCurrentStep(3);
    await saveProgress({ targetAudience: audience });
  };

  const handleAnalysisComplete = async (analysis: AudienceAnalysis) => {
    setAudienceAnalysis(analysis);
    setCurrentStep(4);
    await saveProgress({ audienceAnalysis: analysis });
  };

  const handleHookSelect = async (hooks: AdHook[]) => {
    setSelectedHooks(hooks);
    setCurrentStep(5);
    await saveProgress({ selectedHooks: hooks });
  };

  const handleFormatSelect = async (format: AdFormat) => {
    setAdFormat(format);
    setCurrentStep(6);
    await saveProgress({ adFormat: format });
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleStartOver = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await clearProgress(session.user.id);
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