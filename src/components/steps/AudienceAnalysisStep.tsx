import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BusinessIdea, TargetAudience, AudienceAnalysis } from "@/types/adWizard";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import StepNavigation from "../wizard/StepNavigation";

interface AudienceAnalysisStepProps {
  businessIdea: BusinessIdea;
  targetAudience: TargetAudience;
  onNext: (analysis: AudienceAnalysis) => void;
  onBack: () => void;
}

const AudienceAnalysisStep = ({
  businessIdea,
  targetAudience,
  onNext,
  onBack,
}: AudienceAnalysisStepProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleNext = async () => {
    if (isLoading) {
      return;
    }
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ad-content', {
        body: { 
          type: 'audience_analysis',
          businessIdea,
          targetAudience
        }
      });

      if (error) throw error;

      onNext(data.analysis);
      toast({
        title: "Analysis Complete",
        description: "Your audience analysis has been generated successfully.",
      });
    } catch (error) {
      console.error('Error generating audience analysis:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate audience analysis. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isLoading}
          className="space-x-2 w-full md:w-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous Step</span>
        </Button>
        <Button
          onClick={handleNext}
          disabled={isLoading}
          className="bg-facebook hover:bg-facebook/90 text-white w-full md:w-auto"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>

      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-2">Audience Analysis</h2>
        <p className="text-gray-600">
          We'll analyze your target audience to create compelling ad content that resonates with them.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Business Idea</h3>
              <p className="text-gray-600">{businessIdea.description}</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Target Audience</h3>
              <p className="text-gray-600">{targetAudience.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AudienceAnalysisStep;