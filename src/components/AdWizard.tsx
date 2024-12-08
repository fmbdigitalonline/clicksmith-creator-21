import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import BusinessIdeaStep from "./steps/BusinessIdeaStep";
import AudienceStep from "./steps/AudienceStep";
import HookStep from "./steps/HookStep";
import PreviewStep from "./steps/PreviewStep";
import WizardProgress from "./WizardProgress";

export type BusinessIdea = {
  description: string;
  valueProposition: string;
};

export type TargetAudience = {
  name: string;
  description: string;
  painPoints: string[];
  demographics: string;
};

export type Hook = {
  text: string;
  description: string;
};

const AdWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [businessIdea, setBusinessIdea] = useState<BusinessIdea | null>(null);
  const [selectedAudience, setSelectedAudience] = useState<TargetAudience | null>(
    null
  );
  const [selectedHook, setSelectedHook] = useState<Hook | null>(null);

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-center mb-8 text-facebook">
        Facebook Ad Generator
      </h1>
      <WizardProgress currentStep={currentStep} />
      <Card className="p-6 mt-8 animate-fadeIn">
        {currentStep === 1 && (
          <BusinessIdeaStep
            onNext={(idea) => {
              setBusinessIdea(idea);
              nextStep();
            }}
          />
        )}
        {currentStep === 2 && businessIdea && (
          <AudienceStep
            businessIdea={businessIdea}
            onNext={(audience) => {
              setSelectedAudience(audience);
              nextStep();
            }}
            onBack={prevStep}
          />
        )}
        {currentStep === 3 && selectedAudience && (
          <HookStep
            audience={selectedAudience}
            onNext={(hook) => {
              setSelectedHook(hook);
              nextStep();
            }}
            onBack={prevStep}
          />
        )}
        {currentStep === 4 && businessIdea && selectedAudience && selectedHook && (
          <PreviewStep
            businessIdea={businessIdea}
            audience={selectedAudience}
            hook={selectedHook}
            onBack={prevStep}
          />
        )}
      </Card>
    </div>
  );
};

export default AdWizard;