
import { ProfileStep } from "./steps/ProfileStep";
import { UserTypeStep } from "./steps/UserTypeStep";
import { AiFeaturesStep } from "./steps/AiFeaturesStep";
import { ContentFormatsStep } from "./steps/ContentFormatsStep";
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
  userType: string;
  setUserType: (value: string) => void;
}

export function OnboardingStepContent({
  currentStep,
  fullName,
  setFullName,
  industry,
  setIndustry,
  businessSize,
  setBusinessSize,
  userType,
  setUserType,
}: OnboardingStepContentProps) {
  switch (currentStep) {
    case 0:
      return (
        <ProfileStep
          fullName={fullName}
          setFullName={setFullName}
        />
      );
    case 1:
      return (
        <UserTypeStep
          userType={userType}
          setUserType={setUserType}
          industry={industry}
          setIndustry={setIndustry}
          businessSize={businessSize}
          setBusinessSize={setBusinessSize}
        />
      );
    case 2:
      return <AiFeaturesStep userType={userType} />;
    case 3:
      return <ContentFormatsStep userType={userType} />;
    case 4:
      return <AudienceStep userType={userType} />;
    case 5:
      return <GettingStartedStep userType={userType} />;
    default:
      return null;
  }
}
