import { useAdWizardState } from "@/hooks/useAdWizardState";
import IdeaStep from "./steps/BusinessIdeaStep";
import AudienceStep from "./steps/AudienceStep";
import AudienceAnalysisStep from "./steps/AudienceAnalysisStep";
import HookStep from "./steps/HookStep";
import AdGalleryStep from "./steps/AdGalleryStep";
import WizardHeader from "./wizard/WizardHeader";
import WizardProgress from "./WizardProgress";
import { useState, useMemo } from "react";
import CreateProjectDialog from "./projects/CreateProjectDialog";
import { useNavigate } from "react-router-dom";

const AdWizard = () => {
  const [showCreateProject, setShowCreateProject] = useState(false);
  const navigate = useNavigate();
  
  const {
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
  } = useAdWizardState();

  const handleCreateProject = () => {
    setShowCreateProject(true);
  };

  const handleProjectCreated = (projectId: string) => {
    setShowCreateProject(false);
    navigate(`/ad-wizard/${projectId}`);
  };

  // Memoize the current step component to prevent unnecessary re-renders
  const currentStepComponent = useMemo(() => {
    switch (currentStep) {
      case 1:
        return <IdeaStep onNext={handleIdeaSubmit} />;
      case 2:
        return businessIdea ? (
          <AudienceStep
            businessIdea={businessIdea}
            onNext={handleAudienceSelect}
            onBack={handleBack}
          />
        ) : null;
      case 3:
        return businessIdea && targetAudience ? (
          <AudienceAnalysisStep
            businessIdea={businessIdea}
            targetAudience={targetAudience}
            onNext={handleAnalysisComplete}
            onBack={handleBack}
          />
        ) : null;
      case 4:
        return businessIdea && targetAudience && audienceAnalysis ? (
          <HookStep
            businessIdea={businessIdea}
            targetAudience={targetAudience}
            onNext={handleHookSelect}
            onBack={handleBack}
          />
        ) : null;
      case 5:
        return businessIdea && targetAudience && selectedHooks.length > 0 ? (
          <AdGalleryStep
            businessIdea={businessIdea}
            targetAudience={targetAudience}
            adHooks={selectedHooks}
            onStartOver={handleStartOver}
            onBack={handleBack}
            onCreateProject={handleCreateProject}
          />
        ) : null;
      default:
        return null;
    }
  }, [currentStep, businessIdea, targetAudience, audienceAnalysis, selectedHooks]);

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <WizardHeader
        title="ProfitPilot"
        description="Quickly go from idea to ready-to-run ads by testing different audience segments with AI-powered Facebook ad campaigns."
      />

      <div className="mb-8">
        <WizardProgress
          currentStep={currentStep}
          onStepClick={setCurrentStep}
          canNavigateToStep={canNavigateToStep}
        />
      </div>

      {currentStepComponent}

      <CreateProjectDialog
        open={showCreateProject}
        onOpenChange={setShowCreateProject}
        onSuccess={handleProjectCreated}
        initialBusinessIdea={businessIdea?.description}
      />
    </div>
  );
};

export default AdWizard;