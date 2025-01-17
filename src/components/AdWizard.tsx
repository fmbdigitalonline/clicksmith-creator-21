import { useAdWizardState } from "@/hooks/useAdWizardState";
import WizardHeader from "./wizard/WizardHeader";
import WizardProgress from "./WizardProgress";
import CreateProjectDialog from "./projects/CreateProjectDialog";
import VideoToggle from "./wizard/VideoToggle";
import StepRenderer from "./wizard/StepRenderer";
import { useWizardContainer } from "@/hooks/wizard/useWizardContainer";

const AdWizard = () => {
  const {
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
  } = useAdWizardState();

  const {
    showCreateProject,
    setShowCreateProject,
    videoAdsEnabled,
    generatedAds,
    hasLoadedInitialAds,
    handleCreateProject,
    handleProjectCreated,
    handleVideoAdsToggle,
    handleAdsGenerated,
  } = useWizardContainer();

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <WizardHeader
        title="Idea Pilot"
        description="Quickly go from idea to ready-to-run ads by testing different audience segments with AI-powered social media ad campaigns."
      />

      <div className="mb-8">
        <WizardProgress
          currentStep={currentStep}
          onStepClick={setCurrentStep}
          canNavigateToStep={canNavigateToStep}
        />
      </div>

      <VideoToggle
        videoAdsEnabled={videoAdsEnabled}
        onToggle={handleVideoAdsToggle}
      />

      <StepRenderer
        currentStep={currentStep}
        businessIdea={businessIdea}
        targetAudience={targetAudience}
        audienceAnalysis={audienceAnalysis}
        selectedHooks={selectedHooks}
        videoAdsEnabled={videoAdsEnabled}
        generatedAds={generatedAds}
        hasLoadedInitialAds={hasLoadedInitialAds}
        onIdeaSubmit={handleIdeaSubmit}
        onAudienceSelect={handleAudienceSelect}
        onAnalysisComplete={handleAnalysisComplete}
        onBack={handleBack}
        onStartOver={handleStartOver}
        onCreateProject={handleCreateProject}
        onAdsGenerated={handleAdsGenerated}
      />

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