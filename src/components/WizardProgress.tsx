import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  "Business Idea",
  "Target Audience",
  "Hook Selection",
  "Ad Preview",
];

interface WizardProgressProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  canNavigateToStep: (step: number) => boolean;
}

const WizardProgress = ({ 
  currentStep, 
  onStepClick,
  canNavigateToStep 
}: WizardProgressProps) => {
  return (
    <div className="flex justify-between items-center w-full">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isClickable = canNavigateToStep(stepNumber);
        
        return (
          <div
            key={step}
            className={cn(
              "flex flex-col items-center flex-1 relative",
              isClickable && "cursor-pointer"
            )}
            onClick={() => isClickable && onStepClick(stepNumber)}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                stepNumber <= currentStep
                  ? "bg-facebook text-white"
                  : "bg-gray-200 text-gray-500",
                isClickable && "hover:bg-facebook/90"
              )}
            >
              {stepNumber < currentStep ? (
                <CheckIcon className="w-5 h-5" />
              ) : (
                stepNumber
              )}
            </div>
            <span
              className={cn(
                "mt-2 text-sm",
                stepNumber <= currentStep
                  ? "text-facebook font-medium"
                  : "text-gray-500",
                isClickable && "hover:text-facebook/90"
              )}
            >
              {step}
            </span>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "absolute top-4 left-1/2 w-full h-0.5 -z-10",
                  stepNumber < currentStep ? "bg-facebook" : "bg-gray-200"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default WizardProgress;