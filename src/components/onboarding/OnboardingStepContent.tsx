import { ProfileStep } from "./steps/ProfileStep";
import { AiFeaturesStep } from "./steps/AiFeaturesStep";
import { AdFormatsStep } from "./steps/AdFormatsStep";
import { AudienceStep } from "./steps/AudienceStep";
import { GettingStartedStep } from "./steps/GettingStartedStep";

interface OnboardingStepContentProps {
  currentStep: number;
  fullName: string;
  setFullName: (value: string) => void;
  industry: string;
  setIndustry: (value: string) => void;
  businessSize: string;
  setBusinessSize: (value: string) => void;
}

export function OnboardingStepContent({
  currentStep,
  fullName,
  setFullName,
  industry,
  setIndustry,
  businessSize,
  setBusinessSize,
}: OnboardingStepContentProps) {
  switch (currentStep) {
    case 0:
      return (
        <ProfileStep
          fullName={fullName}
          setFullName={setFullName}
          industry={industry}
          setIndustry={setIndustry}
          businessSize={businessSize}
          setBusinessSize={setBusinessSize}
        />
      );
    case 1:
      return <AiFeaturesStep />;
    case 2:
      return <AdFormatsStep />;
    case 3:
      return <AudienceStep />;
    case 4:
      return <GettingStartedStep />;
    default:
      return null;
  }
}