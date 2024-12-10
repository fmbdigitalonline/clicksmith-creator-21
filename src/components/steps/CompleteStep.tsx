import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BusinessIdea, TargetAudience, AdHook, AdFormat, AdImage } from "@/types/adWizard";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CompleteStepProps {
  businessIdea: BusinessIdea;
  targetAudience: TargetAudience;
  adHook: AdHook;
  adFormat: AdFormat;
  onStartOver: () => void;
  onBack: () => void;
}

const CompleteStep = ({
  businessIdea,
  targetAudience,
  adHook,
  adFormat,
  onStartOver,
  onBack,
}: CompleteStepProps) => {
  const [adImages, setAdImages] = useState<AdImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateImages = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ad-content', {
        body: { 
          type: 'images',
          businessIdea,
          targetAudience,
          adHook,
          adFormat
        }
      });

      if (error) throw error;

      setAdImages(data.images);
      toast({
        title: "Images Generated!",
        description: "Your ad images have been generated successfully.",
      });
    } catch (error) {
      console.error('Error generating images:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate images. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (adImages.length === 0) {
      generateImages();
    }
  }, []);

  const handleExport = () => {
    toast({
      title: "Ads Exported!",
      description: "Your ads have been saved and are ready for use.",
    });
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
            onClick={onStartOver}
            variant="outline"
            className="space-x-2 w-full md:w-auto"
          >
            Start Over
          </Button>
          <Button
            onClick={handleExport}
            className="bg-facebook hover:bg-facebook/90 space-x-2 w-full md:w-auto"
            disabled={adImages.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export All Variants
          </Button>
        </div>
      </div>

      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-2">Your Ad Variants</h2>
        <p className="text-gray-600">
          Review your generated ad variants and export them for use.
        </p>
      </div>

      {isGenerating ? (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-facebook" />
            <p className="text-gray-600">Generating your ad variants...</p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adImages.map((image, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="aspect-video relative">
                <img
                  src={image.url}
                  alt={`Ad variant ${index + 1}`}
                  className="object-cover w-full h-full"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium text-lg mb-2">Variant {index + 1}</h3>
                <p className="text-gray-600 text-sm mb-4">{adHook.text}</p>
                <p className="text-gray-500 text-xs">{businessIdea.valueProposition}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card className="bg-gray-50 border-none">
        <CardContent className="p-6">
          <h4 className="font-medium mb-4 text-gray-900">Ad Details</h4>
          <div className="space-y-4">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-1">Format</h5>
              <p className="text-sm text-gray-600">
                {adFormat.format} ({adFormat.dimensions.width} x {adFormat.dimensions.height}px)
              </p>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-1">Target Audience</h5>
              <p className="text-sm text-gray-600">{targetAudience.name}</p>
              <p className="text-sm text-gray-600 mt-1">{targetAudience.description}</p>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-1">Hook</h5>
              <p className="text-sm text-gray-600">{adHook.text}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteStep;