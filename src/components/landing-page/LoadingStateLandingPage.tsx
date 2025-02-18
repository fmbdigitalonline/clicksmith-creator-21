
import { Card } from "@/components/ui/card";
import { Loader2, Layout } from "lucide-react";
import { TextCycler } from "@/components/TextCycler";

const LoadingStateLandingPage = () => {
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-blue-500/5 to-background/80 backdrop-blur-sm">
      <Card className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[500px] p-8 shadow-xl border-2 border-blue-500/10">
        <div className="flex flex-col items-center justify-center space-y-8">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-blue-500/20 to-blue-400/20 rounded-full" />
            <div className="relative flex items-center justify-center">
              <Loader2 className="w-16 h-16 animate-spin text-blue-500" />
              <Layout className="w-8 h-8 text-blue-500 absolute" />
            </div>
          </div>
          
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-semibold text-gray-800 animate-fade-in">
              Creating Your Landing Page ✨
            </h3>
            <p className="text-gray-600 text-lg">
              <TextCycler
                items={[
                  "Analyzing your business data 📊",
                  "Crafting compelling headlines 📝",
                  "Designing page sections 🎨",
                  "Optimizing for conversions 📈",
                  "Structuring content layout 🔲",
                  "Adding engaging elements ✨",
                  "Fine-tuning messaging 💭",
                  "Perfecting your page 🌟",
                  "Almost ready... ⚡",
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

export default LoadingStateLandingPage;
