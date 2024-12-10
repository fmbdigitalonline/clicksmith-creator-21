import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";

interface StepNavigationProps {
  onBack: () => void;
  onStartOver: () => void;
  onSaveAndDownload: () => void;
  disabled: boolean;
  isSaving: boolean;
}

const StepNavigation = ({
  onBack,
  onStartOver,
  onSaveAndDownload,
  disabled,
  isSaving,
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
      <div className="flex gap-2">
        <Button
          onClick={onStartOver}
          variant="outline"
          className="space-x-2 w-full md:w-auto"
        >
          Start Over
        </Button>
        <Button
          onClick={onSaveAndDownload}
          className="bg-facebook hover:bg-facebook/90 space-x-2 w-full md:w-auto"
          disabled={disabled || isSaving}
        >
          <Download className="w-4 h-4 mr-2" />
          {isSaving ? "Saving..." : "Save & Download"}
        </Button>
      </div>
    </div>
  );
};

export default StepNavigation;