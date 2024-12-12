import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

const LoadingState = () => {
  return (
    <Card className="p-8">
      <div className="flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-facebook" />
        <p className="text-gray-600">Generating your ad variants...</p>
      </div>
    </Card>
  );
};

export default LoadingState;