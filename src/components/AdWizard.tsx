
import { useAdWizardState } from "@/hooks/useAdWizardState";
import IdeaStep from "./steps/BusinessIdeaStep";
import AudienceStep from "./steps/AudienceStep";
import AudienceAnalysisStep from "./steps/AudienceAnalysisStep";
import AdGalleryStep from "./steps/AdGalleryStep";
import WizardHeader from "./wizard/WizardHeader";
import WizardProgress from "./WizardProgress";
import { useState, useEffect } from "react";
import CreateProjectDialog from "./projects/CreateProjectDialog";
import { useNavigate, useParams } from "react-router-dom";
import { Toggle } from "./ui/toggle";
import { Video, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";
import { Loader2 } from "lucide-react";
import LoadingState from "./steps/LoadingState";
import { useTranslation } from "react-i18next";

const AdWizard = () => {
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [videoAdsEnabled, setVideoAdsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { t } = useTranslation('adwizard');
  
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

  // Default loading state props
  const defaultLoadingProps = {
    platform: "ads",
    generationStatus: "Processing",
    processingStatus: {
      inProgress: false,
      total: 0,
      completed: 0,
      failed: 0
    }
  };

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
          <p className="text-gray-600">{t('loading_project')}</p>
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
          return <LoadingState {...defaultLoadingProps} />;
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
          return <LoadingState {...defaultLoadingProps} />;
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
          return <LoadingState {...defaultLoadingProps} />;
        }
        return (
          <AdGalleryStep />
        );
      default:
        return <LoadingState {...defaultLoadingProps} />;
    }
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <WizardHeader
        title={t('title')}
        description={t('description')}
      />

      <div className="mb-8">
        <WizardProgress
          currentStep={currentStep}
          onStepClick={setCurrentStep}
          canNavigateToStep={canNavigateToStep}
        />
      </div>

      <div className="flex items-center justify-end mb-6 space-x-2">
        <span className="text-sm text-gray-600 font-bold">{t('image_ads')}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Toggle
                  pressed={videoAdsEnabled}
                  onPressedChange={handleVideoAdsToggle}
                  aria-label={t('toggle_video_ads')}
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
              <p>{t('video_ads_tooltip')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className="text-sm text-gray-600">{t('video_ads')}</span>
        <span className="text-xs text-gray-500 italic ml-1">{t('coming_soon')}</span>
      </div>

      {renderStep()}

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
