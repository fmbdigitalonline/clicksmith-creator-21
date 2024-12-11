import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BusinessIdea, TargetAudience, AdHook } from "@/types/adWizard";
import { MessageCircle, ArrowLeft, ArrowRight, Wand2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface HookStepProps {
  businessIdea: BusinessIdea;
  targetAudience: TargetAudience;
  onNext: (hook: AdHook) => void;
  onBack: () => void;
}

const HookStep = ({
  businessIdea,
  targetAudience,
  onNext,
  onBack,
}: HookStepProps) => {
  const [hooks, setHooks] = useState<AdHook[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateHooks = async () => {
    setIsGenerating(true);
    try {
      // Include audienceAnalysis in the targetAudience object
      const enrichedTargetAudience = {
        ...targetAudience,
        audienceAnalysis: targetAudience.audienceAnalysis
      };

      const { data, error } = await supabase.functions.invoke('generate-ad-content', {
        body: { 
          type: 'hooks',
          businessIdea,
          targetAudience: enrichedTargetAudience
        }
      });

      if (error) throw error;

      if (data?.hooks && Array.isArray(data.hooks)) {
        setHooks(data.hooks);
        toast({
          title: "Hooks Generated!",
          description: "New ad hooks have been generated based on your audience's deep pain points.",
        });
      } else {
        throw new Error('Invalid hooks data received');
      }
    } catch (error) {
      console.error('Error generating hooks:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate hooks. Please try again.",
        variant: "destructive",
      });
      setHooks([]);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    generateHooks();
  }, []);

  if (isGenerating && hooks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-facebook mb-4" />
        <p className="text-gray-600">Generating marketing hooks based on audience insights...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="space-x-2 w-full md:w-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous Step</span>
        </Button>
        <Button
          onClick={generateHooks}
          disabled={isGenerating}
          className="bg-facebook hover:bg-facebook/90 text-white w-full md:w-auto"
        >
          {isGenerating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Wand2 className="w-4 h-4 mr-2" />
          )}
          {isGenerating ? "Generating..." : "Generate New Hooks"}
        </Button>
      </div>

      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-2">Marketing Angles & Hooks</h2>
        <p className="text-gray-600">
          Select a compelling angle and hook combination that addresses your audience's deep pain points.
        </p>
      </div>

      <div className="space-y-4">
        {hooks && hooks.length > 0 ? (
          hooks.map((hook, index) => (
            <Card
              key={index}
              className="relative group cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-facebook"
              onClick={() => onNext(hook)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-facebook/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl" />
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <MessageCircle className="w-5 h-5 text-facebook" />
                  <CardTitle className="text-lg">Marketing Angle {index + 1}</CardTitle>
                </div>
                <CardDescription className="text-base font-medium text-gray-700">
                  {hook.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-facebook font-semibold mb-1">Hook:</p>
                  <p className="text-gray-800">{hook.text}</p>
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-5 h-5 text-facebook" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No hooks available. Try generating new ones.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HookStep;