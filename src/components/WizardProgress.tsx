
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

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
    { number: 1, label: t('wizard_progress.business_idea') },
    { number: 2, label: t('wizard_progress.target_audience') },
    { number: 3, label: t('wizard_progress.audience_analysis') },
    { number: 4, label: t('wizard_progress.ad_gallery') },
  ];

  return (
    <div className="w-full">
      <div className="grid grid-cols-4 gap-2">
        {steps.map((step) => {
          const isActive = currentStep === step.number;
          const isCompleted = currentStep > step.number;
          const canNavigate = canNavigateToStep(step.number);

          return (
            <button
              key={step.number}
              className={cn(
                "flex flex-col items-center text-center transition-all",
                canNavigate ? "cursor-pointer" : "cursor-not-allowed opacity-60",
              )}
              onClick={() => canNavigate && onStepClick(step.number)}
              disabled={!canNavigate}
            >
              <div
                className={cn(
                  "w-full h-2 mb-2 rounded-full",
                  isActive || isCompleted
                    ? "bg-facebook"
                    : "bg-gray-200"
                )}
              />
              <div className="flex items-center justify-center">
                <div
                  className={cn(
                    "flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium mr-2",
                    isActive || isCompleted
                      ? "bg-facebook text-white"
                      : "bg-gray-200 text-gray-600"
                  )}
                >
                  {step.number}
                </div>
                <span
                  className={cn(
                    "text-sm font-medium",
                    isActive
                      ? "text-facebook"
                      : isCompleted
                      ? "text-facebook"
                      : "text-gray-500"
                  )}
                >
                  {t('wizard_progress.step')} {step.number}: {step.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WizardProgress;
