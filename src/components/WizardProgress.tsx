import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const steps = [
  {
    title: "Business Idea",
    description: "Describe your product"
  },
  {
    title: "Target Audience",
    description: "Choose who to reach"
  },
  {
    title: "Hook Selection",
    description: "Create your message"
  },
  {
    title: "Ad Preview",
    description: "Review and export"
  }
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
    <div className="relative">
      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -translate-y-1/2" />
      <div className="relative flex justify-between items-center">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isClickable = canNavigateToStep(stepNumber);
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          
          return (
            <div
              key={step.title}
              className={cn(
                "flex flex-col items-center relative",
                isClickable && "cursor-pointer group"
              )}
              onClick={() => isClickable && onStepClick(stepNumber)}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 z-10",
                  isCompleted ? "bg-facebook text-white" :
                  isActive ? "bg-facebook text-white" :
                  "bg-white border-2 border-gray-200 text-gray-400",
                  isClickable && "group-hover:border-facebook group-hover:text-facebook"
                )}
              >
                {isCompleted ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  stepNumber
                )}
              </div>
              <div className="mt-3 text-center">
                <p
                  className={cn(
                    "font-medium mb-1",
                    (isActive || isCompleted) ? "text-facebook" : "text-gray-500"
                  )}
                >
                  {step.title}
                </p>
                <p className="text-sm text-gray-500">
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default WizardProgress;