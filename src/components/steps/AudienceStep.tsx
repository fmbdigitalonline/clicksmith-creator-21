import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BusinessIdea, TargetAudience } from "@/types/adWizard";
import { Users, ArrowLeft, Wand2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const AudienceStep = ({
  businessIdea,
  onNext,
  onBack,
}: {
  businessIdea: BusinessIdea;
  onNext: (audience: TargetAudience) => void;
  onBack: () => void;
}) => {
  const [audiences, setAudiences] = useState<TargetAudience[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [regenerationCount, setRegenerationCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateAudiences = async (forceRegenerate: boolean = false) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      console.log('Calling generate-ad-content function with params:', { 
        type: 'audience',
        businessIdea, 
        regenerationCount,
        forceRegenerate,
        timestamp: new Date().getTime()
      });

      const { data, error } = await supabase.functions.invoke('generate-ad-content', {
        body: { 
          type: 'audience',
          businessIdea: businessIdea,
          regenerationCount: forceRegenerate ? regenerationCount + 1 : regenerationCount,
          timestamp: new Date().getTime(),
          forceRegenerate
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      console.log('Response from generate-ad-content:', data);

      if (!data || !Array.isArray(data.audiences)) {
        console.error('Invalid response format:', data);
        throw new Error('Invalid response format from server');
      }

      console.log('Generated audiences:', data.audiences);
      
      if (forceRegenerate) {
        setRegenerationCount(prev => prev + 1);
      }
      
      setAudiences(data.audiences);
      
      if (forceRegenerate) {
        toast({
          title: "Fresh Audiences Generated!",
          description: "New target audiences have been generated based on your business idea.",
        });
      }
    } catch (error) {
      console.error('Error generating audiences:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate audiences';
      setError(errorMessage);
      toast({
        title: "Generation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (audiences.length === 0) {
      generateAudiences(false);
    }
  }, []);

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
          onClick={() => generateAudiences(true)}
          disabled={isGenerating}
          className="bg-facebook hover:bg-facebook/90 text-white w-full md:w-auto"
        >
          {isGenerating ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Wand2 className="w-4 h-4 mr-2" />
          )}
          {isGenerating ? "Regenerating..." : "Generate New Audiences"}
        </Button>
      </div>

      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-2">Choose Your Target Audience</h2>
        <p className="text-gray-600">
          Select the audience that best matches your ideal customers.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <p className="font-medium">Error occurred:</p>
          <p>{error}</p>
          <p className="text-sm mt-2">Please try again or contact support if the issue persists.</p>
        </div>
      )}

      {isGenerating ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-facebook" />
        </div>
      ) : audiences.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No audiences generated yet. Please try again.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
          {audiences.map((audience, index) => (
            <Card
              key={`${audience.name}-${index}`}
              className="relative group cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-facebook"
              onClick={() => onNext(audience)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-facebook/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl" />
              <CardHeader>
                <div className="flex items-center space-x-2 mb-2">
                  <Users className="w-5 h-5 text-facebook" />
                  <CardTitle className="text-lg">{audience.name}</CardTitle>
                </div>
                <CardDescription>{audience.demographics}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm mb-2">{audience.description}</p>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-facebook">Pain Points:</p>
                    <ul className="text-sm list-disc list-inside text-gray-600 space-y-1">
                      {audience.painPoints.map((point, pointIndex) => (
                        <li key={`${point}-${pointIndex}`}>{point}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t">
                  <div>
                    <p className="text-sm font-medium text-facebook">Ideal Customer Profile:</p>
                    <p className="text-sm text-gray-600">{audience.icp}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-facebook">Core Message:</p>
                    <p className="text-sm text-gray-600">{audience.coreMessage}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-facebook">Positioning:</p>
                    <p className="text-sm text-gray-600">{audience.positioning}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-facebook">Marketing Angle:</p>
                    <p className="text-sm text-gray-600">{audience.marketingAngle}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-facebook">Messaging Approach:</p>
                    <p className="text-sm text-gray-600">{audience.messagingApproach}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-facebook">Marketing Channels:</p>
                    <ul className="text-sm list-disc list-inside text-gray-600">
                      {audience.marketingChannels.map((channel, channelIndex) => (
                        <li key={`${channel}-${channelIndex}`}>{channel}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AudienceStep;