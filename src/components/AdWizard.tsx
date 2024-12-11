import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import IdeaStep from "./steps/BusinessIdeaStep";
import AudienceStep from "./steps/AudienceStep";
import AudienceAnalysisStep from "./steps/AudienceAnalysisStep";
import HookStep from "./steps/HookStep";
import AdSizeStep from "./steps/AdSizeStep";
import CompleteStep from "./steps/CompleteStep";
import WizardHeader from "./wizard/WizardHeader";
import WizardProgress from "./WizardProgress";
import {
  BusinessIdea,
  TargetAudience,
  AudienceAnalysis,
  AdFormat,
  AdHook,
} from "@/types/adWizard";

const AdWizard = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [businessIdea, setBusinessIdea] = useState<BusinessIdea | null>(null);
  const [targetAudience, setTargetAudience] = useState<TargetAudience | null>(null);
  const [audienceAnalysis, setAudienceAnalysis] = useState<AudienceAnalysis | null>(null);
  const [adFormat, setAdFormat] = useState<AdFormat | null>(null);
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

  const handleFormatSelect = (format: AdFormat) => {
    setAdFormat(format);
    setCurrentStep(6);
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  const handleStartOver = () => {
    setBusinessIdea(null);
    setTargetAudience(null);
    setAudienceAnalysis(null);
    setAdFormat(null);
    setSelectedHooks([]);
    setCurrentStep(1);
  };

  const canNavigateToStep = (step: number) => {
    switch (step) {
      case 1: return true;
      case 2: return !!businessIdea;
      case 3: return !!businessIdea && !!targetAudience;
      case 4: return !!businessIdea && !!targetAudience && !!audienceAnalysis;
      case 5: return !!businessIdea && !!targetAudience && !!audienceAnalysis && selectedHooks.length > 0;
      case 6: return !!businessIdea && !!targetAudience && !!audienceAnalysis && selectedHooks.length > 0 && !!adFormat;
      default: return false;
    }
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <WizardHeader
        title="Facebook Ad Generator"
        description="Create compelling Facebook ads in minutes with our AI-powered wizard."
      />

      <div className="mb-8">
        <WizardProgress
          currentStep={currentStep}
          onStepClick={setCurrentStep}
          canNavigateToStep={canNavigateToStep}
        />
      </div>

      {currentStep === 1 && (
        <IdeaStep onNext={handleIdeaSubmit} />
      )}

      {currentStep === 2 && businessIdea && (
        <AudienceStep
          businessIdea={businessIdea}
          onNext={handleAudienceSelect}
          onBack={handleBack}
        />
      )}

      {currentStep === 3 && businessIdea && targetAudience && (
        <AudienceAnalysisStep
          businessIdea={businessIdea}
          targetAudience={targetAudience}
          onNext={handleAnalysisComplete}
          onBack={handleBack}
        />
      )}

      {currentStep === 4 && businessIdea && targetAudience && audienceAnalysis && (
        <HookStep
          businessIdea={businessIdea}
          targetAudience={targetAudience}
          onNext={handleHookSelect}
          onBack={handleBack}
        />
      )}

      {currentStep === 5 && businessIdea && targetAudience && audienceAnalysis && selectedHooks.length > 0 && (
        <AdSizeStep
          onNext={handleFormatSelect}
          onBack={handleBack}
        />
      )}

      {currentStep === 6 && businessIdea && targetAudience && adFormat && selectedHooks.length > 0 && (
        <CompleteStep
          businessIdea={businessIdea}
          targetAudience={targetAudience}
          adHooks={selectedHooks}
          adFormat={adFormat}
          onStartOver={handleStartOver}
          onBack={handleBack}
        />
      )}
    </div>
  );
};

export default AdWizard;