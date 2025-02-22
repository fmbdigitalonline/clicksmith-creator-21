
import { useAdWizardState } from "@/hooks/useAdWizardState";
import IdeaStep from "./steps/BusinessIdeaStep";
import AudienceStep from "./steps/AudienceStep";
import AudienceAnalysisStep from "./steps/AudienceAnalysisStep";
import AdGalleryStep from "./steps/AdGalleryStep";
import WizardHeader from "./wizard/WizardHeader";
import WizardProgress from "./WizardProgress";
import { useState, useEffect, useRef } from "react";
import CreateProjectDialog from "./projects/CreateProjectDialog";
import { useNavigate, useParams } from "react-router-dom";
import { Toggle } from "./ui/toggle";
import { Video, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Loader2 } from "lucide-react";
import StepLoadingState from "./steps/LoadingState";
import { ScrollArea } from "./ui/scroll-area";

const AdWizard = () => {
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [videoAdsEnabled, setVideoAdsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const contentRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { projectId } = useParams();
  
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

  // Handle project initialization
  useEffect(() => {
    const initializeProject = async () => {
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (projectId === "new") {
          await supabase
            .from('wizard_progress')
            .delete()
            .eq('user_id', user.id);
        } else if (projectId) {
          const { data: project } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

          if (!project) {
            navigate('/ad-wizard/new');
          } else {
            setVideoAdsEnabled(project.video_ads_enabled || false);
          }
        }
      } catch (error) {
        console.error("Error initializing project:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeProject();
  }, [projectId, navigate]);

  // Scroll to content when step changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [currentStep]);

  const handleCreateProject = () => {
    setShowCreateProject(true);
  };

  const handleProjectCreated = (projectId: string) => {
    setShowCreateProject(false);
    navigate(`/ad-wizard/${projectId}`);
  };

  const handleVideoAdsToggle = async (enabled: boolean) => {
    // Disabled for now - will be implemented in future
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-facebook" />
          <p className="text-gray-600">Loading project data...</p>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <IdeaStep onNext={handleIdeaSubmit} initialBusinessIdea={businessIdea} />;
      case 2:
        if (!businessIdea) {
          return <StepLoadingState />;
        }
        return (
          <AudienceStep
            businessIdea={businessIdea}
            onNext={handleAudienceSelect}
            onBack={handleBack}
          />
        );
      case 3:
        if (!businessIdea || !targetAudience) {
          return <StepLoadingState />;
        }
        return (
          <AudienceAnalysisStep
            businessIdea={businessIdea}
            targetAudience={targetAudience}
            onNext={handleAnalysisComplete}
            onBack={handleBack}
          />
        );
      case 4:
        if (!businessIdea || !targetAudience || !audienceAnalysis) {
          return <StepLoadingState />;
        }
        return (
          <AdGalleryStep
            businessIdea={businessIdea}
            targetAudience={targetAudience}
            adHooks={selectedHooks}
            onStartOver={handleStartOver}
            onBack={handleBack}
            onCreateProject={handleCreateProject}
            videoAdsEnabled={videoAdsEnabled}
          />
        );
      default:
        return <StepLoadingState />;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-none bg-white border-b border-border px-4 py-2 sticky top-0 z-10">
        <div className="flex justify-between items-center">
          <WizardHeader
            title="Idea Wizard"
            description="Quickly go from idea to ready-to-run ads by testing different audience segments with AI-powered Facebook ad campaigns."
          />
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 font-bold">Image Ads</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Toggle
                      pressed={videoAdsEnabled}
                      onPressedChange={handleVideoAdsToggle}
                      aria-label="Toggle video ads"
                      className="data-[state=on]:bg-gray-300 cursor-not-allowed opacity-50"
                      disabled
                    >
                      {videoAdsEnabled ? (
                        <Video className="h-4 w-4" />
                      ) : (
                        <Image className="h-4 w-4" />
                      )}
                    </Toggle>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Video Ads - Coming Soon!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <span className="text-sm text-gray-600">Video Ads</span>
            <span className="text-xs text-gray-500 italic ml-1">Coming Soon!</span>
          </div>
        </div>

        <div className="mt-2">
          <WizardProgress
            currentStep={currentStep}
            onStepClick={setCurrentStep}
            canNavigateToStep={canNavigateToStep}
          />
        </div>
      </div>

      <ScrollArea className="flex-grow px-4 py-4">
        <div ref={contentRef} className="max-w-6xl mx-auto">
          {renderStep()}
        </div>
      </ScrollArea>

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
