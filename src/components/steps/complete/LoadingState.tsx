
import { Card } from "@/components/ui/card";
import { Loader2, Wand2 } from "lucide-react";
import { TextCycler } from "@/components/TextCycler";

const LoadingState = () => {
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-facebook/5 to-background/80 backdrop-blur-sm">
      <Card className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[500px] p-8 shadow-xl border-2 border-facebook/10">
        <div className="flex flex-col items-center justify-center space-y-8">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-facebook/20 to-blue-400/20 rounded-full" />
            <div className="relative flex items-center justify-center">
              <Loader2 className="w-16 h-16 animate-spin text-facebook" />
              <Wand2 className="w-8 h-8 text-facebook absolute" />
            </div>
          </div>
          
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-semibold text-gray-800 animate-fade-in">
              Crafting Your Perfect Ad ✨
            </h3>
            <p className="text-gray-600 text-lg">
              <TextCycler
                items={[
                  "Analyzing your target audience 🎯",
                  "Crafting engaging hooks 🎣",
                  "Designing visual elements 🎨",
                  "Optimizing ad copy ✍️",
                  "Generating creative variations 🔄",
                  "Fine-tuning messaging 💭",
                  "Enhancing engagement potential 📈",
                  "Perfecting your ad magic ⚡",
                  "Almost ready to amaze... 🌟",
                ]}
                interval={2500}
              />
            </p>
            <p className="text-sm text-gray-500 mt-6 animate-pulse">
              This might take a minute or two...
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LoadingState;
