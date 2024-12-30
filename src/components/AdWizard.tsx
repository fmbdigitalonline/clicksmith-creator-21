import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdWizardState } from "@/hooks/useAdWizardState";
import WizardHeader from "./wizard/WizardHeader";
import StepNavigation from "./wizard/StepNavigation";
import BusinessIdeaStep from "./steps/BusinessIdeaStep";
import AudienceStep from "./steps/AudienceStep";
import AudienceAnalysisStep from "./steps/AudienceAnalysisStep";
import HookStep from "./steps/HookStep";
import AdFormatStep from "./steps/AdFormatStep";
import AdSizeStep from "./steps/AdSizeStep";
import CampaignStep from "./steps/CampaignStep";
import PreviewStep from "./steps/PreviewStep";
import CompleteStep from "./steps/CompleteStep";
import { useToast } from "@/hooks/use-toast";
import { BusinessIdea, TargetAudience, AudienceAnalysis, AdHook, AdFormat, AdImage } from "@/types/adWizard";

const AdWizard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const wizardState = useAdWizardState();

  useEffect(() => {
    const loadProjectData = async () => {
      if (projectId && projectId !== "new") {
        try {
          const { data: project, error } = await supabase
            .from("projects")
            .select("*")
            .eq("id", projectId)
            .single();

          if (error) throw error;

          if (project) {
            if (project.business_idea) {
              wizardState.handleIdeaSubmit(project.business_idea as BusinessIdea);
            }
            if (project.target_audience) {
              wizardState.handleAudienceSelect(project.target_audience as TargetAudience);
            }
            if (project.audience_analysis) {
              wizardState.handleAnalysisComplete(project.audience_analysis as AudienceAnalysis);
            }
            if (project.selected_hooks) {
              wizardState.handleHooksSelect(project.selected_hooks as AdHook[]);
            }
            if (project.ad_format) {
              // Convert the string ad_format to AdFormat type
              const adFormat: AdFormat = {
                format: project.ad_format,
                dimensions: project.ad_dimensions || { width: 1200, height: 628 },
                aspectRatio: "16:9",
                description: "Facebook Ad Format",
                platform: "facebook"
              };
              wizardState.handleAdFormatSelect(adFormat);
            }
            if (project.video_ad_settings) {
              wizardState.handleVideoPreferencesUpdate(project.video_ad_settings);
            }
            if (project.ad_dimensions) {
              wizardState.handleAdDimensionsUpdate(project.ad_dimensions);
            }
            if (project.video_ads_enabled !== undefined) {
              wizardState.handleVideoAdsToggle(project.video_ads_enabled);
            }
          }
        } catch (error) {
          console.error("Error loading project:", error);
          toast({
            title: "Error loading project",
            description: "Failed to load project data. Please try again.",
            variant: "destructive",
          });
          navigate("/projects");
          return;
        }
      }
      setIsLoading(false);
    };

    loadProjectData();
  }, [projectId, navigate, toast, wizardState]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const renderCurrentStep = () => {
    switch (wizardState.currentStep) {
      case 1:
        return <BusinessIdeaStep onNext={wizardState.handleIdeaSubmit} />;
      case 2:
        return (
          <AudienceStep
            businessIdea={wizardState.businessIdea!}
            onNext={wizardState.handleAudienceSelect}
            onBack={wizardState.handleBack}
          />
        );
      case 3:
        return (
          <AudienceAnalysisStep
            businessIdea={wizardState.businessIdea!}
            targetAudience={wizardState.targetAudience!}
            onNext={wizardState.handleAnalysisComplete}
            onBack={wizardState.handleBack}
          />
        );
      case 4:
        return (
          <HookStep
            businessIdea={wizardState.businessIdea!}
            targetAudience={wizardState.targetAudience!}
            onNext={wizardState.handleHooksSelect}
            onBack={wizardState.handleBack}
          />
        );
      case 5:
        return (
          <AdFormatStep
            businessIdea={wizardState.businessIdea!}
            targetAudience={wizardState.targetAudience!}
            campaign={wizardState.marketingCampaign!}
            onNext={wizardState.handleGeneratedImages}
            onBack={wizardState.handleBack}
          />
        );
      case 6:
        return (
          <AdSizeStep
            onNext={wizardState.handleAdDimensionsUpdate}
            onBack={wizardState.handleBack}
          />
        );
      case 7:
        return (
          <CampaignStep
            businessIdea={wizardState.businessIdea!}
            targetAudience={wizardState.targetAudience!}
            audienceAnalysis={wizardState.audienceAnalysis!}
            onNext={wizardState.handleCampaignComplete}
            onBack={wizardState.handleBack}
          />
        );
      case 8:
        return (
          <PreviewStep
            businessIdea={wizardState.businessIdea!}
            audience={wizardState.targetAudience!}
            hook={wizardState.selectedHooks[0]}
            onBack={wizardState.handleBack}
          />
        );
      case 9:
        return (
          <CompleteStep
            businessIdea={wizardState.businessIdea!}
            targetAudience={wizardState.targetAudience!}
            adHooks={wizardState.selectedHooks}
            adFormat={wizardState.adFormat!}
            onStartOver={wizardState.handleStartOver}
            onBack={wizardState.handleBack}
            onCreateProject={wizardState.handleCreateProject}
          />
        );
      default:
        return <BusinessIdeaStep onNext={wizardState.handleIdeaSubmit} />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <WizardHeader 
        title="Create Your Ad Campaign"
        description="Follow the steps to create your perfect ad campaign"
      />
      {renderCurrentStep()}
      <StepNavigation />
    </div>
  );
};

export default AdWizard;