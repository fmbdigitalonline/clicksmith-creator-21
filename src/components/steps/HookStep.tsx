import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BusinessIdea, TargetAudience, AdHook } from "../AdWizard";
import { MessageCircle, ArrowLeft, ArrowRight, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const mockHooks: AdHook[] = [
  {
    text: "Transform Your Health Journey in Just 5 Minutes a Day!",
    description:
      "Emphasizes quick and easy implementation while promising significant results.",
  },
  {
    text: "The Smart Way to Stay Hydrated - Your Personal Health Assistant",
    description:
      "Positions the product as an intelligent solution to a common problem.",
  },
  {
    text: "Never Miss Your Health Goals Again - Start Your Journey Today!",
    description: "Creates urgency and addresses the fear of failing health goals.",
  },
];

const HookStep = ({
  businessIdea,
  targetAudience,
  onNext,
  onBack,
}: {
  businessIdea: BusinessIdea;
  targetAudience: TargetAudience;
  onNext: (hook: AdHook) => void;
  onBack: () => void;
}) => {
  const [hooks, setHooks] = useState(mockHooks);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateHooks = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ad-content', {
        body: { businessIdea: businessIdea, audience: targetAudience }
      });

      if (error) throw error;

      // Parse the generated content and create hook objects
      const generatedHooks = data.content.split('\n')
        .filter((line: string) => line.trim().length > 0)
        .map((hook: string) => ({
          text: hook.replace(/^\d+\.\s*/, '').trim(),
          description: "AI-generated hook based on your business and audience",
        }));

      setHooks(generatedHooks);
      toast({
        title: "Hooks Generated!",
        description: "New ad hooks have been generated based on your business and audience.",
      });
    } catch (error) {
      console.error('Error generating hooks:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate hooks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
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
        <Button
          onClick={generateHooks}
          disabled={isGenerating}
          className="bg-facebook hover:bg-facebook/90 text-white w-full md:w-auto"
        >
          <Wand2 className="w-4 h-4 mr-2" />
          {isGenerating ? "Generating..." : "Generate New Hooks"}
        </Button>
      </div>

      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-2">Choose Your Ad Hook</h2>
        <p className="text-gray-600">
          Select a compelling message that will grab your audience's attention.
        </p>
      </div>

      <div className="space-y-4">
        {hooks.map((hook) => (
          <Card
            key={hook.text}
            className="relative group cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-facebook"
            onClick={() => onNext(hook)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-facebook/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl" />
            <CardHeader>
              <div className="flex items-center space-x-3">
                <MessageCircle className="w-5 h-5 text-facebook" />
                <CardTitle className="text-lg">{hook.text}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                {hook.description}
              </CardDescription>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-5 h-5 text-facebook" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HookStep;