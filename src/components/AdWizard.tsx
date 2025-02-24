
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
import StepLoadingState from "./steps/LoadingState";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const AdWizard = () => {
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [videoAdsEnabled, setVideoAdsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { projectId } = useParams();
  const { toast } = useToast();
  
  const { data: user } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    }
  });

  // Query to check credits
  const { data: credits } = useQuery({
    queryKey: ["credits", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;

      // Check if user is admin
      if (user.email === 'info@fmbonline.nl') {
        return -1; // Special value for unlimited credits
      }

      const { data: subscription } = await supabase
        .from("subscriptions")
        .select("credits_remaining")
        .eq("user_id", user.id)
        .eq("active", true)
        .maybeSingle();

      if (subscription?.credits_remaining) {
        return subscription.credits_remaining;
      }

      const { data: freeUsage } = await supabase
        .from("free_tier_usage")
        .select("generations_used")
        .eq("user_id", user.id)
        .maybeSingle();

      const usedGenerations = freeUsage?.generations_used || 0;
      return Math.max(0, 3 - usedGenerations);
    },
    enabled: !!user?.id,
    refetchInterval: 5000
  });

  // Effect to check credits and redirect if needed
  useEffect(() => {
    if (credits === 0) {
      toast({
        title: "No credits remaining",
        description: "Please upgrade your plan to continue generating ads.",
        variant: "destructive",
      });
      navigate('/pricing');
    }
  }, [credits, navigate, toast]);

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
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <WizardHeader
        title="Idea Wizard"
        description="Quickly go from idea to ready-to-run ads by testing different audience segments with AI-powered Facebook ad campaigns."
      />

      <div className="mb-8">
        <WizardProgress
          currentStep={currentStep}
          onStepClick={setCurrentStep}
          canNavigateToStep={canNavigateToStep}
        />
      </div>

      <div className="flex items-center justify-end mb-6 space-x-2">
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
