
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";

interface WizardProgressProps {
  currentStep: number;
  onStepClick: (step: number) => void;
  canNavigateToStep: (step: number) => boolean;
}

const WizardProgress = ({
  currentStep,
  onStepClick,
  canNavigateToStep,
}: WizardProgressProps) => {
  const { t } = useTranslation('adwizard');

  const steps = [
    { number: 1, title: t('steps.idea') },
    { number: 2, title: t('steps.audience') },
    { number: 3, title: t('steps.analysis') },
    { number: 4, title: t('steps.ads') },
  ];

  return (
    <nav aria-label="Progress">
      <ol role="list" className="space-y-4 md:flex md:space-x-8 md:space-y-0">
        {steps.map((step, index) => (
          <li key={step.title} className="md:flex-1">
            <button
              className={cn(
                "group flex w-full flex-col border-l-4 py-2 pl-4 md:border-l-0 md:border-t-4 md:pb-0 md:pl-0 md:pt-4",
                step.number < currentStep
                  ? "border-facebook hover:border-facebook/80"
                  : step.number === currentStep
                  ? "border-facebook"
                  : "border-gray-200",
                !canNavigateToStep(step.number) && "cursor-not-allowed opacity-50"
              )}
              onClick={() => canNavigateToStep(step.number) && onStepClick(step.number)}
              disabled={!canNavigateToStep(step.number)}
            >
              <span className="text-sm font-medium">
                {step.number < currentStep ? (
                  <Check className="h-4 w-4 text-facebook" />
                ) : (
                  <span
                    className={cn(
                      "text-sm font-medium",
                      step.number === currentStep
                        ? "text-facebook"
                        : "text-gray-500"
                    )}
                  >
                    {t('step')} {step.number}
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  step.number === currentStep
                    ? "text-facebook"
                    : "text-gray-500"
                )}
              >
                {step.title}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default WizardProgress;
