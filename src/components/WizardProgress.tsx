import { CheckIcon } from "lucide-react";

const steps = [
  "Business Idea",
  "Target Audience",
  "Hook Selection",
  "Ad Preview",
];

const WizardProgress = ({ currentStep }: { currentStep: number }) => {
  return (
    <div className="flex justify-between items-center w-full">
      {steps.map((step, index) => (
        <div
          key={step}
          className="flex flex-col items-center flex-1 relative"
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              index + 1 <= currentStep
                ? "bg-facebook text-white"
                : "bg-gray-200 text-gray-500"
            }`}
          >
            {index + 1 < currentStep ? (
              <CheckIcon className="w-5 h-5" />
            ) : (
              index + 1
            )}
          </div>
          <span
            className={`mt-2 text-sm ${
              index + 1 <= currentStep
                ? "text-facebook font-medium"
                : "text-gray-500"
            }`}
          >
            {step}
          </span>
          {index < steps.length - 1 && (
            <div
              className={`absolute top-4 left-1/2 w-full h-0.5 -z-10 ${
                index + 1 < currentStep ? "bg-facebook" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default WizardProgress;