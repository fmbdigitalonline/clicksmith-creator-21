
import { Loader2 } from "lucide-react";
import { TextCycler } from "@/components/TextCycler";

const LoadingState = () => {
  const loadingMessages = [
    "Crafting your perfect landing page... ✨",
    "Generating compelling headlines... 📝",
    "Creating eye-catching visuals... 🎨",
    "Optimizing for conversions... 🎯",
    "Adding that special touch... ✨",
    "Almost ready to wow your audience... 🚀",
    "Polishing the final details... ⭐️",
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] animate-fade-in">
      <div className="flex flex-col items-center space-y-6 max-w-lg text-center px-4">
        <Loader2 className="w-12 h-12 animate-spin text-facebook" />
        <TextCycler
          items={loadingMessages}
          interval={3000}
          className="text-lg text-gray-600 animate-fade-in"
        />
        <p className="text-sm text-gray-500 mt-4">
          This usually takes about 30 seconds. We're making sure everything is perfect! ✨
        </p>
      </div>
    </div>
  );
};

export default LoadingState;
