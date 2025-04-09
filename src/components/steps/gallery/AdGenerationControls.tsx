
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import StepNavigation from "../../wizard/StepNavigation";

interface AdGenerationControlsProps {
  selectedPlatform: string;
  onGenerateClick: () => void;
  isGenerating: boolean;
  onBack?: () => void;
  onStartOver?: () => void;
  generationStatus?: string;
}

const AdGenerationControls = ({
  selectedPlatform,
  onGenerateClick,
  isGenerating,
  onBack,
  onStartOver,
  generationStatus,
}: AdGenerationControlsProps) => {
  return (
    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
      {onBack && onStartOver && (
        <StepNavigation
          onBack={onBack}
          onStartOver={onStartOver}
        />
      )}
      <div className="flex flex-col items-end gap-2 w-full md:w-auto">
        {generationStatus && (
          <p className="text-sm text-gray-600">{generationStatus}</p>
        )}
        <Button
          onClick={onGenerateClick}
          disabled={isGenerating}
          variant="outline"
          className="w-full md:w-auto"
        >
          {isGenerating ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          <span>Generate {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} Ads</span>
        </Button>
      </div>
    </div>
  );
};

export default AdGenerationControls;
