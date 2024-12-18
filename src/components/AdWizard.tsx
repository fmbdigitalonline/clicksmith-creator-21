import { useAdWizardState } from "@/hooks/useAdWizardState";
import IdeaStep from "./steps/BusinessIdeaStep";
import AudienceStep from "./steps/AudienceStep";
import AudienceAnalysisStep from "./steps/AudienceAnalysisStep";
import HookStep from "./steps/HookStep";
import AdGalleryStep from "./steps/AdGalleryStep";
import WizardHeader from "./wizard/WizardHeader";
import WizardProgress from "./WizardProgress";
import { useState } from "react";
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

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <WizardHeader
        title="Business Idea Validator"
        description="Validate your business concept by testing different audience segments with AI-powered Facebook ad campaigns."
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

      {currentStep === 5 && businessIdea && targetAudience && selectedHooks.length > 0 && (
        <AdGalleryStep
          businessIdea={businessIdea}
          targetAudience={targetAudience}
          adHooks={selectedHooks}
          onStartOver={handleStartOver}
          onBack={handleBack}
          onCreateProject={handleCreateProject}
        />
      )}

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