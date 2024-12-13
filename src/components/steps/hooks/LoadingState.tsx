import { Loader2 } from "lucide-react";

const LoadingState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <Loader2 className="w-8 h-8 animate-spin text-facebook mb-4" />
      <p className="text-gray-600">Generating marketing hooks based on audience insights...</p>
    </div>
  );
};

export default LoadingState;