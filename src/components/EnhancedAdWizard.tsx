
import { useEffect } from "react";
import { useAdWizardState } from "@/hooks/useAdWizardState";
import BusinessIdeaStep from "@/components/steps/BusinessIdeaStep";
import AudienceStep from "@/components/steps/AudienceStep";
import EnhancedAudienceStep from "@/components/steps/EnhancedAudienceStep";
import AudienceAnalysisStep from "@/components/steps/AudienceAnalysisStep";
import CampaignStep from "@/components/steps/CampaignStep";
import AdFormatStep from "@/components/steps/AdFormatStep";
import AdSizeStep from "@/components/steps/AdSizeStep";
import HookStep from "@/components/steps/HookStep";
import CompleteStep from "@/components/steps/CompleteStep";
import LoadingState from "@/components/steps/LoadingState";
import WizardProgress from "@/components/WizardProgress";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";
import { Home } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Rendering the step based on the current step number
function renderStep(step: number, adWizardState: ReturnType<typeof useAdWizardState>) {
  const { 
    businessIdea, 
    targetAudience, 
    audienceAnalysis, 
    selectedHooks,
    handleIdeaSubmit,
    handleAudienceSelect,
    handleAnalysisComplete,
    handleBack,
    isLoading
  } = adWizardState;

  switch (step) {
    case 1:
      return <BusinessIdeaStep onNext={handleIdeaSubmit} initialBusinessIdea={businessIdea} />;
    case 2:
      return <EnhancedAudienceStep />;
    case 3:
      return (
        <AudienceAnalysisStep
          businessIdea={businessIdea}
          targetAudience={targetAudience}
          onNext={handleAnalysisComplete}
          onBack={handleBack}
        />
      );
    case 4:
      return (
        <CampaignStep
          businessIdea={businessIdea}
          targetAudience={targetAudience}
          audienceAnalysis={audienceAnalysis}
          onNext={() => {}} // Will be implemented in next phase
          onBack={handleBack}
        />
      );
    case 5:
      return (
        <AdFormatStep
          businessIdea={businessIdea}
          targetAudience={targetAudience}
          campaign={{} as any} // Will be implemented in next phase
          onNext={() => {}} // Will be implemented in next phase
          onBack={handleBack}
        />
      );
    case 6:
      return (
        <AdSizeStep
          onNext={() => {}} // Will be implemented in next phase
          onBack={handleBack}
        />
      );
    case 7:
      return (
        <HookStep
          businessIdea={businessIdea}
          targetAudience={targetAudience}
          onNext={() => {}} // Will be implemented in next phase
          onBack={handleBack}
        />
      );
    case 8:
      return (
        <CompleteStep
          businessIdea={businessIdea}
          targetAudience={targetAudience}
          adHooks={selectedHooks}
          adFormat={{} as any} // Will be implemented in next phase
          adSize={{} as any} // Will be implemented in next phase
          onBack={handleBack}
          onStartOver={() => {}} // Will be implemented in next phase
        />
      );
    default:
      return <BusinessIdeaStep onNext={handleIdeaSubmit} initialBusinessIdea={businessIdea} />;
  }
}

export default function EnhancedAdWizard() {
  const adWizardState = useAdWizardState();
  const { currentStep, isLoading } = adWizardState;
  const { user } = useUser();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if the user is on step 2 (original audience step)
    // and redirect them to the enhanced audience step
    if (currentStep === 2) {
      // No redirect needed, we're replacing the component directly
    }
  }, [currentStep]);

  const handleReturnHome = () => {
    navigate("/");
  };

  return (
    <div className="container max-w-screen-lg py-8">
      <div className="mb-8 flex items-center justify-between">
        <WizardProgress 
          currentStep={currentStep} 
          onStepClick={(step) => adWizardState.goToStep ? adWizardState.goToStep(step) : null}
          canNavigateToStep={(step) => adWizardState.canNavigateToStep ? adWizardState.canNavigateToStep(step) : false}
        />
        
        <Button variant="outline" size="sm" onClick={handleReturnHome}>
          <Home className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
      </div>
      
      {isLoading ? <LoadingState /> : renderStep(currentStep, adWizardState)}
    </div>
  );
}
