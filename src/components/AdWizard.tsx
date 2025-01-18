import { useAdWizardState } from "@/hooks/useAdWizardState";
import IdeaStep from "./steps/BusinessIdeaStep";
import AudienceStep from "./steps/AudienceStep";
import AudienceAnalysisStep from "./steps/AudienceAnalysisStep";
import AdGalleryStep from "./steps/AdGalleryStep";
import WizardHeader from "./wizard/WizardHeader";
import WizardProgress from "./WizardProgress";
import { useState } from "react";
import CreateProjectDialog from "./projects/CreateProjectDialog";
import { useNavigate, useParams } from "react-router-dom";
import { Toggle } from "./ui/toggle";
import { Video, Image } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';
import { WizardStateManager } from "./wizard/WizardStateManager";
import { AnonymousSessionManager } from "./wizard/AnonymousSessionManager";
import { useToast } from "@/hooks/use-toast";

const AdWizard = () => {
  const [showCreateProject, setShowCreateProject] = useState(false);
  const navigate = useNavigate();
  const { projectId } = useParams();
  const [sessionId] = useState(() => localStorage.getItem('anonymous_session_id') || uuidv4());
  const { toast } = useToast();
  
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

  const handleCreateProject = () => {
    setShowCreateProject(true);
  };

  const handleProjectCreated = (projectId: string) => {
    setShowCreateProject(false);
    navigate(`/ad-wizard/${projectId}`);
  };

  const handleWizardStartOver = async () => {
    console.log('Starting over wizard...');
    await handleStartOver();
    setCurrentStep(1);
    toast({
      title: "Progress Reset",
      description: "Your progress has been cleared. Start fresh!",
    });
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <AnonymousSessionManager sessionId={sessionId} />
      
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

      <WizardStateManager projectId={projectId}>
        {({
          generatedAds,
          videoAdsEnabled,
          hasLoadedInitialAds,
          handleVideoAdsToggle,
          handleAdsGenerated,
        }) => (
          <>
            <div className="flex items-center justify-end mb-6 space-x-2">
              <span className="text-sm text-gray-600">Image Ads</span>
              <Toggle
                pressed={videoAdsEnabled}
                onPressedChange={handleVideoAdsToggle}
                aria-label="Toggle video ads"
                className="data-[state=on]:bg-facebook"
              >
                {videoAdsEnabled ? (
                  <Video className="h-4 w-4" />
                ) : (
                  <Image className="h-4 w-4" />
                )}
              </Toggle>
              <span className="text-sm text-gray-600">Video Ads</span>
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
              <AdGalleryStep
                key={`gallery-${Date.now()}`}
                businessIdea={businessIdea}
                targetAudience={targetAudience}
                adHooks={selectedHooks}
                onStartOver={handleWizardStartOver}
                onBack={handleBack}
                onCreateProject={handleCreateProject}
                videoAdsEnabled={videoAdsEnabled}
                generatedAds={[]} // Reset generated ads on start over
                onAdsGenerated={handleAdsGenerated}
                hasLoadedInitialAds={false} // Force new generation
              />
            )}
          </>
        )}
      </WizardStateManager>

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