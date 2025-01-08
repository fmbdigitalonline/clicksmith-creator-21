import { useState } from "react";
import { Card } from "@/components/ui/card";
import { BusinessIdea, TargetAudience, AdHook, AdFormat, AdImage } from "@/types/adWizard";
import AdDetails from "./complete/AdDetails";
import AdVariantGrid from "./complete/AdVariantGrid";
import StepNavigation from "./complete/StepNavigation";
import LoadingState from "./complete/LoadingState";
import Header from "./complete/Header";

interface CompleteStepProps {
  businessIdea: BusinessIdea;
  targetAudience: TargetAudience;
  adHooks: AdHook[];
  adFormat: AdFormat;
  generatedImages?: AdImage[];
  onStartOver: () => void;
  onBack: () => void;
  onCreateProject: () => void;
}

const CompleteStep = ({
  businessIdea,
  targetAudience,
  adHooks,
  adFormat,
  generatedImages = [],
  onStartOver,
  onBack,
  onCreateProject,
}: CompleteStepProps) => {
  const [isGenerating] = useState(false);

  return (
    <div className="space-y-6 md:space-y-8">
      <StepNavigation
        onBack={onBack}
        onStartOver={onStartOver}
      />

      <Header
        title="Your Ad Variants"
        description="Review your generated ad variants, provide feedback, and save or download them for use."
      />

      {isGenerating ? (
        <LoadingState />
      ) : (
        <>
          <AdVariantGrid
            adImages={generatedImages}
            adHooks={adHooks}
            businessIdea={businessIdea}
            onCreateProject={onCreateProject}
          />

          <Card className="bg-gray-50">
            <div className="p-6">
              <AdDetails
                adFormat={adFormat}
                targetAudience={targetAudience}
              />
            </div>
          </Card>
        </>
      )}
    </div>
  );
};

export default CompleteStep;