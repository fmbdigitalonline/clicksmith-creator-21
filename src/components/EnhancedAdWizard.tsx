
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
function renderStep(step: number) {
  switch (step) {
    case 1:
      return <BusinessIdeaStep />;
    case 2:
      return <EnhancedAudienceStep />;
    case 3:
      return <AudienceAnalysisStep />;
    case 4:
      return <CampaignStep />;
    case 5:
      return <AdFormatStep />;
    case 6:
      return <AdSizeStep />;
    case 7:
      return <HookStep />;
    case 8:
      return <CompleteStep />;
    default:
      return <BusinessIdeaStep />;
  }
}

export default function EnhancedAdWizard() {
  const { step, loading } = useAdWizardState();
  const { user } = useUser();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if the user is on step 2 (original audience step)
    // and redirect them to the enhanced audience step
    if (step === 2) {
      // No redirect needed, we're replacing the component directly
    }
  }, [step]);

  const handleReturnHome = () => {
    navigate("/");
  };

  return (
    <div className="container max-w-screen-lg py-8">
      <div className="mb-8 flex items-center justify-between">
        <WizardProgress currentStep={step} />
        
        <Button variant="outline" size="sm" onClick={handleReturnHome}>
          <Home className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
      </div>
      
      {loading ? <LoadingState /> : renderStep(step)}
    </div>
  );
}
