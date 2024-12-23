import { useState, useCallback } from "react";
import {
  BusinessIdea,
  TargetAudience,
  AudienceAnalysis,
  AdHook
} from "@/types/adWizard";

export const useAdWizardState = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [businessIdea, setBusinessIdea] = useState<BusinessIdea | null>(null);
  const [targetAudience, setTargetAudience] = useState<TargetAudience | null>(null);
  const [audienceAnalysis, setAudienceAnalysis] = useState<AudienceAnalysis | null>(null);
  const [selectedHooks, setSelectedHooks] = useState<AdHook[]>([]);

  const handleIdeaSubmit = useCallback((idea: BusinessIdea) => {
    setBusinessIdea(idea);
    setCurrentStep(2);
  }, []);

  const handleAudienceSelect = useCallback((audience: TargetAudience) => {
    setTargetAudience(audience);
    setCurrentStep(3);
  }, []);

  const handleAnalysisComplete = useCallback((analysis: AudienceAnalysis) => {
    setAudienceAnalysis(analysis);
    // Generate hooks automatically here
    const { data: { hooks } } = await supabase.functions.invoke('generate-ad-content', {
      body: { 
        type: 'hooks',
        businessIdea,
        targetAudience: {
          ...targetAudience,
          audienceAnalysis: analysis
        }
      }
    });
    setSelectedHooks(hooks);
    setCurrentStep(4);
  }, [businessIdea, targetAudience]);

  const handleBack = useCallback(() => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  }, []);

  const handleStartOver = useCallback(() => {
    setBusinessIdea(null);
    setTargetAudience(null);
    setAudienceAnalysis(null);
    setSelectedHooks([]);
    setCurrentStep(1);
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
    handleIdeaSubmit,
    handleAudienceSelect,
    handleAnalysisComplete,
    handleBack,
    handleStartOver,
    canNavigateToStep,
    setCurrentStep,
  };
};

export default useAdWizardState;