
import { Loader2 } from "lucide-react";

const StepLoadingState = () => {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-facebook" />
        <p className="text-gray-600">Loading step data...</p>
      </div>
    </div>
  );
};

export default StepLoadingState;
