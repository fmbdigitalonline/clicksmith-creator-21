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
    title: "Audience Analysis",
    description: "Deep audience insights"
  },
  {
    title: "Marketing Hooks",
    description: "Create your message"
  },
  {
    title: "Ad Format",
    description: "Choose size & platform"
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
      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2" />
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
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 z-10",
                  isCompleted ? "bg-facebook text-white shadow-lg" :
                  isActive ? "bg-facebook text-white ring-4 ring-facebook/20" :
                  "bg-white border-2 border-gray-200 text-gray-400",
                  isClickable && !isActive && !isCompleted && "group-hover:border-facebook/50 group-hover:text-facebook"
                )}
              >
                {isCompleted ? (
                  <CheckIcon className="w-6 h-6" />
                ) : (
                  stepNumber
                )}
              </div>
              <div className="mt-4 text-center">
                <p
                  className={cn(
                    "font-medium mb-1 transition-colors duration-200",
                    (isActive || isCompleted) ? "text-facebook" : "text-gray-500",
                    isClickable && !isActive && !isCompleted && "group-hover:text-facebook"
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