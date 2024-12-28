import { useState } from "react";
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

  const handleIdeaSubmit = (idea: BusinessIdea) => {
    setBusinessIdea(idea);
    setCurrentStep(2);
  };

  const handleAudienceSelect = (audience: TargetAudience) => {
    setTargetAudience(audience);
    setCurrentStep(3);
  };

  const handleAnalysisComplete = (analysis: AudienceAnalysis) => {
    setAudienceAnalysis(analysis);
    setCurrentStep(4);
  };

  const handleHookSelect = (hooks: AdHook[]) => {
    setSelectedHooks(hooks);
    setCurrentStep(5);
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleStartOver = () => {
    setBusinessIdea(null);
    setTargetAudience(null);
    setAudienceAnalysis(null);
    setSelectedHooks([]);
    setCurrentStep(1);
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
      default:
        return false;
    }
  };

  return {
    currentStep,
    businessIdea,
    targetAudience,
    audienceAnalysis,
    selectedHooks,
    handleIdeaSubmit,
    handleAudienceSelect,
    handleAnalysisComplete,
    handleHookSelect,
    handleBack,
    handleStartOver,
    canNavigateToStep,
    setCurrentStep,
  };
};

export default useAdWizardState;