import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/router";

export type BusinessIdea = {
  description: string;
  valueProposition: string;
};

export type TargetAudience = {
  name: string;
  description: string;
  demographics: string;
  painPoints: string[];
  icp: string;
  coreMessage: string;
  positioning: string;
  marketingAngle: string;
  messagingApproach: string;
  marketingChannels: string[];
};

export type AdHook = {
  content: string;
};

type Step = "idea" | "audience" | "hook" | "complete";

const AdWizard = () => {
  const [currentStep, setCurrentStep] = useState<Step>("idea");
  const [businessIdea, setBusinessIdea] = useState<BusinessIdea | null>(null);
  const [targetAudience, setTargetAudience] = useState<TargetAudience | null>(null);
  const [adHook, setAdHook] = useState<AdHook | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleIdeaSubmit = (idea: BusinessIdea) => {
    setBusinessIdea(idea);
    setCurrentStep("audience");
  };

  const handleAudienceSelect = (audience: TargetAudience) => {
    setTargetAudience(audience);
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
      case "hook":
        setCurrentStep("audience");
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
    setAdHook(null);
    setCurrentStep("idea");
  };

  return (
    <div className="container max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">
          Facebook Ad Generator
        </h1>
        <p className="text-gray-600">
          Create compelling Facebook ads in minutes with our AI-powered wizard.
        </p>
      </div>

      {currentStep === "idea" && (
        <IdeaStep onSubmit={handleIdeaSubmit} />
      )}

      {currentStep === "audience" && businessIdea && (
        <AudienceStep
          businessIdea={businessIdea}
          onNext={handleAudienceSelect}
          onBack={handleBack}
        />
      )}

      {currentStep === "hook" && businessIdea && targetAudience && (
        <HookStep
          businessIdea={businessIdea}
          targetAudience={targetAudience}
          onNext={handleHookSelect}
          onBack={handleBack}
        />
      )}

      {currentStep === "complete" && businessIdea && targetAudience && adHook && (
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