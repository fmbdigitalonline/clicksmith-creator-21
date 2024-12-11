import { useAdWizardState } from "@/hooks/useAdWizardState";
import IdeaStep from "./steps/BusinessIdeaStep";
import AudienceStep from "./steps/AudienceStep";
import AudienceAnalysisStep from "./steps/AudienceAnalysisStep";
import HookStep from "./steps/HookStep";
import AdSizeStep from "./steps/AdSizeStep";
import CompleteStep from "./steps/CompleteStep";
import WizardHeader from "./wizard/WizardHeader";
import WizardProgress from "./WizardProgress";

const AdWizard = () => {
  const {
    currentStep,
    businessIdea,
    targetAudience,
    audienceAnalysis,
    adFormat,
    selectedHooks,
    handleIdeaSubmit,
    handleAudienceSelect,
    handleAnalysisComplete,
    handleHookSelect,
    handleFormatSelect,
    handleBack,
    handleStartOver,
    canNavigateToStep,
  } = useAdWizardState();

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <WizardHeader
        title="Facebook Ad Generator"
        description="Create compelling Facebook ads in minutes with our AI-powered wizard."
      />

      <div className="mb-8">
        <WizardProgress
          currentStep={currentStep}
          onStepClick={(step) => setCurrentStep(step)}
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