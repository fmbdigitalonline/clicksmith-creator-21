import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import IdeaStep from "./steps/BusinessIdeaStep";
import AudienceStep from "./steps/AudienceStep";
import AudienceAnalysisStep from "./steps/AudienceAnalysisStep";
import CampaignStep from "./steps/CampaignStep";
import AdFormatStep from "./steps/AdFormatStep";
import HookStep from "./steps/HookStep";
import CompleteStep from "./steps/CompleteStep";
import WizardHeader from "./wizard/WizardHeader";
import {
  BusinessIdea,
  TargetAudience,
  AudienceAnalysis,
  MarketingCampaign,
  AdFormat,
  AdHook,
  Step,
} from "@/types/adWizard";

const AdWizard = () => {
  const [currentStep, setCurrentStep] = useState<Step>("idea");
  const [businessIdea, setBusinessIdea] = useState<BusinessIdea | null>(null);
  const [targetAudience, setTargetAudience] = useState<TargetAudience | null>(null);
  const [audienceAnalysis, setAudienceAnalysis] = useState<AudienceAnalysis | null>(null);
  const [campaign, setCampaign] = useState<MarketingCampaign | null>(null);
  const [adFormat, setAdFormat] = useState<AdFormat | null>(null);
  const [adHook, setAdHook] = useState<AdHook | null>(null);
  const [generatedHooks, setGeneratedHooks] = useState<AdHook[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleIdeaSubmit = (idea: BusinessIdea) => {
    setBusinessIdea(idea);
    setCurrentStep("audience");
  };

  const handleAudienceSelect = (audience: TargetAudience) => {
    setTargetAudience(audience);
    setCurrentStep("analysis");
  };

  const handleAnalysisComplete = (analysis: AudienceAnalysis) => {
    setAudienceAnalysis(analysis);
    setCurrentStep("campaign");
  };

  const handleCampaignComplete = (campaignData: MarketingCampaign) => {
    setCampaign(campaignData);
    setCurrentStep("format");
  };

  const handleFormatSelect = (format: AdFormat, hooks: AdHook[]) => {
    setAdFormat(format);
    setGeneratedHooks(hooks);
    setCurrentStep("hook");
  };

  const handleHookSelect = (hook: AdHook) => {
    setAdHook(hook);
    setCurrentStep("complete");
    toast({
      title: "Ad Creation Complete!",
      description: "Your Facebook ad has been created successfully.",
    });
  };

  const handleBack = () => {
    switch (currentStep) {
      case "audience":
        setCurrentStep("idea");
        break;
      case "analysis":
        setCurrentStep("audience");
        break;
      case "campaign":
        setCurrentStep("analysis");
        break;
      case "format":
        setCurrentStep("campaign");
        break;
      case "hook":
        setCurrentStep("format");
        break;
      case "complete":
        setCurrentStep("hook");
        break;
      default:
        break;
    }
  };

  const handleStartOver = () => {
    setBusinessIdea(null);
    setTargetAudience(null);
    setAudienceAnalysis(null);
    setCampaign(null);
    setAdFormat(null);
    setAdHook(null);
    setGeneratedHooks([]);
    setCurrentStep("idea");
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <WizardHeader
        title="Facebook Ad Generator"
        description="Create compelling Facebook ads in minutes with our AI-powered wizard."
      />

      {currentStep === "idea" && (
        <IdeaStep onNext={handleIdeaSubmit} />
      )}

      {currentStep === "audience" && businessIdea && (
        <AudienceStep
          businessIdea={businessIdea}
          onNext={handleAudienceSelect}
          onBack={handleBack}
        />
      )}

      {currentStep === "analysis" && businessIdea && targetAudience && (
        <AudienceAnalysisStep
          businessIdea={businessIdea}
          targetAudience={targetAudience}
          onNext={handleAnalysisComplete}
          onBack={handleBack}
        />
      )}

      {currentStep === "campaign" && businessIdea && targetAudience && audienceAnalysis && (
        <CampaignStep
          businessIdea={businessIdea}
          targetAudience={targetAudience}
          audienceAnalysis={audienceAnalysis}
          onNext={handleCampaignComplete}
          onBack={handleBack}
        />
      )}

      {currentStep === "format" && businessIdea && targetAudience && campaign && (
        <AdFormatStep
          businessIdea={businessIdea}
          targetAudience={targetAudience}
          campaign={campaign}
          onNext={handleFormatSelect}
          onBack={handleBack}
        />
      )}

      {currentStep === "hook" && businessIdea && targetAudience && adFormat && (
        <HookStep
          businessIdea={businessIdea}
          targetAudience={targetAudience}
          initialHooks={generatedHooks}
          onNext={handleHookSelect}
          onBack={handleBack}
        />
      )}

      {currentStep === "complete" && businessIdea && targetAudience && adFormat && adHook && (
        <CompleteStep
          businessIdea={businessIdea}
          targetAudience={targetAudience}
          adHook={adHook}
          onStartOver={handleStartOver}
          onBack={handleBack}
        />
      )}
    </div>
  );
};

export default AdWizard;