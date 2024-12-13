import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BusinessIdea, TargetAudience, AdHook } from "@/types/adWizard";
import { ArrowLeft, ArrowRight, Wand2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import LoadingState from "./hooks/LoadingState";
import HookCard from "./hooks/HookCard";

interface HookStepProps {
  businessIdea: BusinessIdea;
  targetAudience: TargetAudience;
  onNext: (hooks: AdHook[]) => void;
  onBack: () => void;
}

const HookStep = ({
  businessIdea,
  targetAudience,
  onNext,
  onBack,
}: HookStepProps) => {
  const [hooks, setHooks] = useState<AdHook[]>([]);
  const [selectedHooks, setSelectedHooks] = useState<AdHook[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateHooks = async () => {
    setIsGenerating(true);
    try {
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

      if (error) {
        // Check if it's an insufficient credits error
        if (error.message?.includes('Insufficient credits')) {
          toast({
            title: "Insufficient Credits",
            description: "You don't have enough credits to generate hooks. Please purchase more credits to continue.",
            variant: "destructive",
          });
          return;
        }
        throw error;
      }

      if (data?.hooks && Array.isArray(data.hooks)) {
        setHooks(data.hooks);
        setSelectedHooks([]); // Reset selections when generating new hooks
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
        description: error instanceof Error ? error.message : "Failed to generate hooks. Please try again.",
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

  const toggleHookSelection = (hook: AdHook) => {
    setSelectedHooks(prev => {
      const isSelected = prev.some(h => h.text === hook.text);
      if (isSelected) {
        return prev.filter(h => h.text !== hook.text);
      } else {
        return [...prev, hook];
      }
    });
  };

  const handleNext = () => {
    if (selectedHooks.length === 0) {
      toast({
        title: "Selection Required",
        description: "Please select at least one marketing angle and hook.",
        variant: "destructive",
      });
      return;
    }
    onNext(selectedHooks);
  };

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
        <div className="flex gap-2">
          <Button
            onClick={generateHooks}
            disabled={isGenerating}
            variant="outline"
            className="w-full md:w-auto"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4 mr-2" />
            )}
            {isGenerating ? "Generating..." : "Generate New Hooks"}
          </Button>
          <Button
            onClick={handleNext}
            disabled={selectedHooks.length === 0}
            className="bg-facebook hover:bg-facebook/90 text-white w-full md:w-auto"
          >
            Next Step
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-2">Marketing Angles & Hooks</h2>
        <p className="text-gray-600">
          Select one or more compelling angles and hook combinations that address your audience's deep pain points.
        </p>
      </div>

      {isGenerating && hooks.length === 0 ? (
        <LoadingState />
      ) : (
        <div className="space-y-4">
          {hooks && hooks.length > 0 ? (
            hooks.map((hook, index) => (
              <HookCard
                key={index}
                hook={hook}
                index={index}
                isSelected={selectedHooks.some(h => h.text === hook.text)}
                onToggle={toggleHookSelection}
              />
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No hooks available. Try generating new ones.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HookStep;