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
    <div className="min-h-screen bg-gradient-radial from-white via-gray-50 to-gray-100">
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8 max-w-5xl">
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 md:mb-8">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-600 hover:text-gray-900 w-fit"
            onClick={() => navigate("/projects")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
          <h1 className="text-h2 md:text-h1 bg-gradient-to-r from-facebook to-blue-600 bg-clip-text text-transparent">
            Facebook Ad Generator
          </h1>
        </div>

        <Card className="bg-gradient-glass backdrop-blur-sm shadow-lg p-4 md:p-6 mb-6 md:mb-8 border-0">
          <h2 className="text-h3 md:text-h2 mb-6 text-gray-800">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-facebook/10 text-facebook flex items-center justify-center font-semibold">
                1
              </div>
              <div>
                <h3 className="text-h3 text-gray-800 mb-2">Describe Your Business</h3>
                <p className="text-body-sm text-gray-600">
                  Tell us about your product or service and what makes it unique
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-facebook/10 text-facebook flex items-center justify-center font-semibold">
                2
              </div>
              <div>
                <h3 className="text-h3 text-gray-800 mb-2">Choose Your Audience</h3>
                <p className="text-body-sm text-gray-600">
                  Define who you want to reach with your ads
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-facebook/10 text-facebook flex items-center justify-center font-semibold">
                3
              </div>
              <div>
                <h3 className="text-h3 text-gray-800 mb-2">Create Your Hook</h3>
                <p className="text-body-sm text-gray-600">
                  Craft a compelling message that resonates
                </p>
              </div>
            </div>
          </div>
        </Card>

        <div className="mb-6 md:mb-8">
          <WizardProgress
            currentStep={currentStep}
            onStepClick={handleStepClick}
            canNavigateToStep={canNavigateToStep}
          />
        </div>

        <Card className="bg-white shadow-lg border-0 p-4 md:p-8 animate-fadeIn">
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
    </div>
  );
};

export default AdWizard;
