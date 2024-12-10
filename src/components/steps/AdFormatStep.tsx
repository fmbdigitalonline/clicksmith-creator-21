import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BusinessIdea, TargetAudience, MarketingCampaign, AdFormat, AdHook } from "../AdWizard";
import { ArrowLeft, ArrowRight, Loader2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface AdFormatStepProps {
  businessIdea: BusinessIdea;
  targetAudience: TargetAudience;
  campaign: MarketingCampaign;
  onNext: (format: AdFormat, hooks: AdHook[]) => void;
  onBack: () => void;
}

const AdFormatStep = ({
  businessIdea,
  targetAudience,
  campaign,
  onNext,
  onBack,
}: AdFormatStepProps) => {
  const [formats, setFormats] = useState<AdFormat[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateFormats = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ad-content', {
        body: { 
          type: 'image_prompts',
          businessIdea,
          targetAudience,
          campaign
        }
      });

      if (error) throw error;

      setFormats(data.formats);
      toast({
        title: "Formats Generated!",
        description: "Ad formats and image prompts have been generated successfully.",
      });
    } catch (error) {
      console.error('Error generating formats:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate ad formats. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (formats.length === 0) {
      generateFormats();
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
          onClick={generateFormats}
          disabled={isGenerating}
          className="bg-facebook hover:bg-facebook/90 text-white w-full md:w-auto"
        >
          <ImageIcon className="w-4 h-4 mr-2" />
          {isGenerating ? "Generating..." : "Generate New Formats"}
        </Button>
      </div>

      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-2">Choose Your Ad Format</h2>
        <p className="text-gray-600">
          Select a format and we'll generate AI image prompts for your campaign.
        </p>
      </div>

      {isGenerating ? (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-facebook" />
            <p className="text-gray-600">Generating ad formats and image prompts...</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-6">
          {formats.map((format) => (
            <Card
              key={format.format}
              className="relative group cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-facebook"
              onClick={() => onNext(format, [])}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-facebook/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl" />
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ImageIcon className="w-5 h-5 text-facebook" />
                  <span>{format.format}</span>
                </CardTitle>
                <CardDescription>
                  {format.dimensions.width} x {format.dimensions.height}px
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {format.imagePrompts.map((prompt, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <p className="font-medium text-facebook mb-2">{prompt.name}</p>
                      <p className="text-sm text-gray-600">{prompt.prompt}</p>
                    </div>
                  ))}
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-5 h-5 text-facebook" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdFormatStep;