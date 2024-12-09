import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BusinessIdea, TargetAudience } from "../AdWizard";
import { Users, ArrowLeft, ArrowRight, Wand2 } from "lucide-react";
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
  const { toast } = useToast();

  const generateAudiences = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ad-content', {
        body: { 
          type: 'audience',
          businessIdea: businessIdea
        }
      });

      if (error) throw error;

      setAudiences(data.audiences);
      toast({
        title: "Audiences Generated!",
        description: "New target audiences have been generated based on your business idea.",
      });
    } catch (error) {
      console.error('Error generating audiences:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate audiences. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate audiences when component mounts if none exist
  useState(() => {
    if (audiences.length === 0) {
      generateAudiences();
    }
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between mb-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous Step</span>
        </Button>
        <Button
          onClick={generateAudiences}
          disabled={isGenerating}
          className="bg-facebook hover:bg-facebook/90 text-white"
        >
          <Wand2 className="w-4 h-4 mr-2" />
          {isGenerating ? "Generating..." : "Generate New Audiences"}
        </Button>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-2">Choose Your Target Audience</h2>
        <p className="text-gray-600">
          Select the audience that best matches your ideal customers.
        </p>
      </div>

      {audiences.length === 0 && !isGenerating && (
        <Card className="p-6 bg-gradient-to-br from-facebook/5 to-transparent">
          <p className="text-center text-gray-600">
            Click "Generate New Audiences" to get AI-generated audience suggestions based on your business idea.
          </p>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {audiences.map((audience) => (
          <Card
            key={audience.name}
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
            <CardContent>
              <p className="text-sm mb-4">{audience.description}</p>
              <div className="space-y-2">
                <p className="text-sm font-medium text-facebook">Pain Points:</p>
                <ul className="text-sm list-disc list-inside text-gray-600 space-y-1">
                  {audience.painPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-5 h-5 text-facebook" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AudienceStep;