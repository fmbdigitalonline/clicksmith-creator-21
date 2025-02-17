
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { TextCycler } from "@/components/TextCycler";

interface LoadingStateProps {
  fullScreen?: boolean;
}

const LoadingState = ({ fullScreen }: LoadingStateProps) => {
  return (
    <div className={`${fullScreen ? 'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm' : ''}`}>
      <Card className={`p-8 ${fullScreen ? 'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[500px]' : 'w-[400px] max-w-full mx-auto'} animate-fade-in`}>
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
                  "Understanding your target audience 👥",
                  "Crafting compelling headlines ✍️",
                  "Designing your layout 🎨",
                  "Generating engaging content 📝",
                  "Creating social proof sections 🌟",
                  "Optimizing for conversions 📈",
                  "Structuring your value proposition 💡",
                  "Personalizing the design theme 🎯",
                  "Finalizing your landing page ✨",
                  "Almost there... 🚀",
                ]}
                interval={2000}
              />
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LoadingState;
