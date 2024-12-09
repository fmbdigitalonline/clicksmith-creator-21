import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import BusinessIdeaStep from "./steps/BusinessIdeaStep";
import AudienceStep from "./steps/AudienceStep";
import HookStep from "./steps/HookStep";
import PreviewStep from "./steps/PreviewStep";
import WizardProgress from "./WizardProgress";
import { ArrowLeft } from "lucide-react";
import { Button } from "./ui/button";
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [businessIdea, setBusinessIdea] = useState<BusinessIdea | null>(null);
  const [selectedAudience, setSelectedAudience] = useState<TargetAudience | null>(
    null
  );
  const [selectedHook, setSelectedHook] = useState<Hook | null>(null);

  useEffect(() => {
    console.log("Current step:", currentStep);
    console.log("Business idea:", businessIdea);
    console.log("Selected audience:", selectedAudience);
    console.log("Selected hook:", selectedHook);
  }, [currentStep, businessIdea, selectedAudience, selectedHook]);

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const canNavigateToStep = (step: number) => {
    if (step <= currentStep) return true;
    if (step === 2 && !businessIdea) return false;
    if (step === 3 && !selectedAudience) return false;
    if (step === 4 && !selectedHook) return false;
    return true;
  };

  const handleStepClick = (step: number) => {
    if (canNavigateToStep(step)) {
      setCurrentStep(step);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            className="mr-4"
            onClick={() => navigate("/projects")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          <h1 className="text-3xl font-bold text-facebook">
            Facebook Ad Generator
          </h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-facebook text-white flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <h3 className="font-medium mb-1">Describe Your Business</h3>
                <p className="text-gray-600 text-sm">
                  Tell us about your product or service
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-facebook text-white flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <h3 className="font-medium mb-1">Choose Your Audience</h3>
                <p className="text-gray-600 text-sm">
                  Select who you want to reach
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-facebook text-white flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <h3 className="font-medium mb-1">Create Your Hook</h3>
                <p className="text-gray-600 text-sm">
                  Pick a compelling message
                </p>
              </div>
            </div>
          </div>
        </div>

        <WizardProgress
          currentStep={currentStep}
          onStepClick={handleStepClick}
          canNavigateToStep={canNavigateToStep}
        />

        <Card className="mt-8 p-8 shadow-lg animate-fadeIn">
          {currentStep === 1 && (
            <BusinessIdeaStep
              onNext={(idea) => {
                console.log("Business idea submitted:", idea);
                setBusinessIdea(idea);
                nextStep();
              }}
            />
          )}
          {currentStep === 2 && businessIdea && (
            <AudienceStep
              businessIdea={businessIdea}
              onNext={(audience) => {
                console.log("Audience selected:", audience);
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
                console.log("Hook selected:", hook);
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
    </div>
  );
};

export default AdWizard;