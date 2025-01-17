import { BusinessIdea, TargetAudience, AdHook } from "@/types/adWizard";
import IdeaStep from "../steps/BusinessIdeaStep";
import AudienceStep from "../steps/AudienceStep";
import AudienceAnalysisStep from "../steps/AudienceAnalysisStep";
import AdGalleryStep from "../steps/AdGalleryStep";

interface StepRendererProps {
  currentStep: number;
  businessIdea: BusinessIdea | null;
  targetAudience: TargetAudience | null;
  audienceAnalysis: any;
  selectedHooks: AdHook[];
  videoAdsEnabled: boolean;
  generatedAds: any[];
  hasLoadedInitialAds: boolean;
  onIdeaSubmit: (idea: BusinessIdea) => void;
  onAudienceSelect: (audience: TargetAudience) => void;
  onAnalysisComplete: (analysis: any) => void;
  onBack: () => void;
  onStartOver: () => void;
  onCreateProject: () => void;
  onAdsGenerated: (ads: any[]) => void;
}

const StepRenderer = ({
  currentStep,
  businessIdea,
  targetAudience,
  audienceAnalysis,
  selectedHooks,
  videoAdsEnabled,
  generatedAds,
  hasLoadedInitialAds,
  onIdeaSubmit,
  onAudienceSelect,
  onAnalysisComplete,
  onBack,
  onStartOver,
  onCreateProject,
  onAdsGenerated,
}: StepRendererProps) => {
  switch (currentStep) {
    case 1:
      return <IdeaStep onNext={onIdeaSubmit} />;
    case 2:
      return businessIdea ? (
        <AudienceStep
          businessIdea={businessIdea}
          onNext={onAudienceSelect}
          onBack={onBack}
        />
      ) : null;
    case 3:
      return businessIdea && targetAudience ? (
        <AudienceAnalysisStep
          businessIdea={businessIdea}
          targetAudience={targetAudience}
          onNext={onAnalysisComplete}
          onBack={onBack}
        />
      ) : null;
    case 4:
      return businessIdea && targetAudience && audienceAnalysis ? (
        <AdGalleryStep
          businessIdea={businessIdea}
          targetAudience={targetAudience}
          adHooks={selectedHooks}
          onStartOver={onStartOver}
          onBack={onBack}
          onCreateProject={onCreateProject}
          videoAdsEnabled={videoAdsEnabled}
          generatedAds={generatedAds}
          onAdsGenerated={onAdsGenerated}
          hasLoadedInitialAds={hasLoadedInitialAds}
        />
      ) : null;
    default:
      return null;
  }
};

export default StepRenderer;