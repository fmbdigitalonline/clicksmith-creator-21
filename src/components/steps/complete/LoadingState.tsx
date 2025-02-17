
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { TextCycler } from "@/components/TextCycler";

const LoadingState = () => {
  return (
    <Card className="p-8 w-[400px] max-w-full mx-auto animate-fade-in">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <Loader2 className="w-12 h-12 animate-spin text-facebook" />
          <div className="absolute inset-0 w-12 h-12 animate-pulse bg-blue-100 rounded-full -z-10" />
        </div>
        
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-gray-800 animate-fade-in">
            Creating Your Landing Page ✨
          </h3>
          <p className="text-gray-600 text-base">
            <TextCycler
              items={[
                "Analyzing your business idea 🔍",
                "Crafting compelling headlines ✍️",
                "Designing your layout 🎨",
                "Adding engaging content 📝",
                "Optimizing for conversions 📈",
                "Almost there... 🌟",
              ]}
              interval={2000}
            />
          </p>
        </div>
      </div>
    </Card>
  );
};

export default LoadingState;
