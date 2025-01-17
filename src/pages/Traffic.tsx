import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import BusinessIdeaStep from "@/components/steps/BusinessIdeaStep";
import AudienceStep from "@/components/steps/AudienceStep";
import AudienceAnalysisStep from "@/components/steps/AudienceAnalysisStep";
import CampaignStep from "@/components/steps/CampaignStep";
import AdFormatStep from "@/components/steps/AdFormatStep";
import AdSizeStep from "@/components/steps/AdSizeStep";
import HookStep from "@/components/steps/HookStep";
import AdGalleryStep from "@/components/steps/AdGalleryStep";
import { BusinessIdea, TargetAudience, AdHook, AdFormat, MarketingCampaign, AdImage } from "@/types/adWizard";
import { useToast } from "@/components/ui/use-toast";

const TrafficPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [businessIdea, setBusinessIdea] = useState<BusinessIdea | null>(null);
  const [targetAudience, setTargetAudience] = useState<TargetAudience | null>(null);
  const [audienceAnalysis, setAudienceAnalysis] = useState<any>(null);
  const [campaign, setCampaign] = useState<MarketingCampaign | null>(null);
  const [adFormat, setAdFormat] = useState<AdFormat | null>(null);
  const [selectedHooks, setSelectedHooks] = useState<AdHook[]>([]);
  const [generatedImages, setGeneratedImages] = useState<AdImage[]>([]);
  const { toast } = useToast();

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < 8) {
      setCurrentStep(currentStep + 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BusinessIdeaStep
            onNext={(idea) => {
              setBusinessIdea(idea);
              handleNext();
            }}
          />
        );
      case 2:
        return businessIdea ? (
          <AudienceStep
            businessIdea={businessIdea}
            onNext={(audience) => {
              setTargetAudience(audience);
              handleNext();
            }}
            onBack={handleBack}
          />
        ) : null;
      case 3:
        return businessIdea && targetAudience ? (
          <AudienceAnalysisStep
            businessIdea={businessIdea}
            targetAudience={targetAudience}
            onNext={(analysis) => {
              setAudienceAnalysis(analysis);
              handleNext();
            }}
            onBack={handleBack}
          />
        ) : null;
      case 4:
        return businessIdea && targetAudience ? (
          <CampaignStep
            businessIdea={businessIdea}
            targetAudience={targetAudience}
            audienceAnalysis={audienceAnalysis}
            onNext={(campaignData) => {
              setCampaign(campaignData);
              handleNext();
            }}
            onBack={handleBack}
          />
        ) : null;
      case 5:
        return businessIdea && targetAudience && campaign ? (
          <AdFormatStep
            businessIdea={businessIdea}
            targetAudience={targetAudience}
            campaign={campaign}
            onNext={(images) => {
              setGeneratedImages(images);
              handleNext();
            }}
            onBack={handleBack}
          />
        ) : null;
      case 6:
        return (
          <AdSizeStep
            onNext={(format) => {
              setAdFormat(format);
              handleNext();
            }}
            onBack={handleBack}
          />
        );
      case 7:
        return businessIdea && targetAudience ? (
          <HookStep
            businessIdea={businessIdea}
            targetAudience={targetAudience}
            onNext={(hooks) => {
              setSelectedHooks(hooks);
              handleNext();
            }}
            onBack={handleBack}
          />
        ) : null;
      case 8:
        return businessIdea && targetAudience && selectedHooks ? (
          <AdGalleryStep
            businessIdea={businessIdea}
            targetAudience={targetAudience}
            adHooks={selectedHooks}
            generatedImages={generatedImages}
            onStartOver={() => {
              setCurrentStep(1);
              setBusinessIdea(null);
              setTargetAudience(null);
              setAudienceAnalysis(null);
              setCampaign(null);
              setAdFormat(null);
              setSelectedHooks([]);
              setGeneratedImages([]);
            }}
            onBack={handleBack}
            onCreateProject={() => {
              toast({
                title: "Sign up required",
                description: "Please sign up to save your project and access more features.",
              });
            }}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Ad Campaign Generator</h1>
            <p className="mt-2 text-gray-600">
              Create targeted ad campaigns in minutes with AI-powered assistance
            </p>
          </div>
          
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-500">
                  Step {currentStep} of 8
                </span>
              </div>
              <div className="flex space-x-2">
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="flex items-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                )}
                {currentStep < 8 && (
                  <Button
                    onClick={handleNext}
                    className="flex items-center bg-facebook hover:bg-facebook/90"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {renderStep()}
        </Card>
      </div>
    </div>
  );
};

export default TrafficPage;