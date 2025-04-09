
import { Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface LoadingStateProps {
  platform: string;
  generationStatus: string;
  processingStatus: {
    inProgress: boolean;
    total: number;
    completed: number;
    failed: number;
  };
}

const LoadingState = ({ platform, generationStatus, processingStatus }: LoadingStateProps) => {
  const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
  const progress = processingStatus.total > 0 
    ? ((processingStatus.completed + processingStatus.failed) / processingStatus.total) * 100
    : 0;

  return (
    <div className="flex flex-col items-center justify-center py-16 space-y-8">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <h3 className="text-xl font-medium">
          {generationStatus || `Generating ${platformName} Ads`}
        </h3>
        <p className="text-muted-foreground text-center max-w-md">
          We're creating unique ad content tailored for {platformName}.
          This typically takes about 15-30 seconds.
        </p>
      </div>

      {processingStatus.inProgress && (
        <div className="w-full max-w-md space-y-2">
          <div className="flex justify-between text-sm">
            <span>Processing images for {platformName}</span>
            <span>{processingStatus.completed} of {processingStatus.total} complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}
    </div>
  );
};

export default LoadingState;
