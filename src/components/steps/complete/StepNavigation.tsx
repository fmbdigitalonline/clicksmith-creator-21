import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface StepNavigationProps {
  onBack: () => void;
  onStartOver: () => void;
}

const StepNavigation = ({
  onBack,
  onStartOver,
}: StepNavigationProps) => {
  return (
    <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
      <Button
        variant="outline"
        onClick={onBack}
        className="space-x-2 w-full md:w-auto"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Previous Step</span>
      </Button>
      <Button
        onClick={onStartOver}
        variant="outline"
        className="space-x-2 w-full md:w-auto"
      >
        Start Over
      </Button>
    </div>
  );
};

export default StepNavigation;