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

const AdWizard = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const wizardState = useAdWizardState();

  useEffect(() => {
    const loadProjectData = async () => {
      // Only attempt to load project data if projectId exists and is not "new"
      if (projectId && projectId !== "new") {
        try {
          const { data: project, error } = await supabase
            .from("projects")
            .select("*")
            .eq("id", projectId)
            .single();

          if (error) throw error;

          if (project) {
            // Initialize wizard state with project data
            if (project.business_idea) wizardState.handleIdeaSubmit(project.business_idea);
            if (project.target_audience) wizardState.handleAudienceSelect(project.target_audience);
            if (project.audience_analysis) wizardState.handleAnalysisComplete(project.audience_analysis);
            if (project.selected_hooks) wizardState.setSelectedHooks(project.selected_hooks);
            if (project.ad_format) wizardState.setAdFormat(project.ad_format);
            if (project.video_ad_preferences) wizardState.setVideoAdPreferences(project.video_ad_preferences);
            if (project.ad_dimensions) wizardState.setAdDimensions(project.ad_dimensions);
            if (project.video_ads_enabled !== undefined) wizardState.setVideoAdsEnabled(project.video_ads_enabled);
          }
        } catch (error) {
          console.error("Error loading project:", error);
          toast({
            title: "Error loading project",
            description: "Failed to load project data. Please try again.",
            variant: "destructive",
          });
          // Redirect to projects page if project loading fails
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
        return <BusinessIdeaStep />;
      case 2:
        return <AudienceStep />;
      case 3:
        return <AudienceAnalysisStep />;
      case 4:
        return <HookStep />;
      case 5:
        return <AdFormatStep />;
      case 6:
        return <AdSizeStep />;
      case 7:
        return <CampaignStep />;
      case 8:
        return <PreviewStep />;
      case 9:
        return <CompleteStep />;
      default:
        return <BusinessIdeaStep />;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <WizardHeader />
      {renderCurrentStep()}
      <StepNavigation />
    </div>
  );
};

export default AdWizard;
