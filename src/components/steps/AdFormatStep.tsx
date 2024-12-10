import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BusinessIdea, TargetAudience, MarketingCampaign, AdImage } from "@/types/adWizard";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

interface AdFormatStepProps {
  businessIdea: BusinessIdea;
  targetAudience: TargetAudience;
  campaign: MarketingCampaign;
  onNext: (images: AdImage[]) => void;
  onBack: () => void;
}

const AdFormatStep = ({
  businessIdea,
  targetAudience,
  campaign,
  onNext,
  onBack,
}: AdFormatStepProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<AdImage[]>([]);
  const { toast } = useToast();

  const generateImages = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ad-content', {
        body: { 
          type: 'images',
          businessIdea,
          targetAudience,
          campaign
        }
      });

      if (error) throw error;

      setImages(data.images);
      
      toast({
        title: "Images Generated!",
        description: "AI images have been generated successfully. Review them and click 'Continue' when ready.",
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
    if (images.length === 0) {
      generateImages();
    }
  }, []);

  const handleContinue = () => {
    onNext(images);
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
        {!isGenerating && images.length > 0 && (
          <Button 
            onClick={handleContinue}
            className="space-x-2 w-full md:w-auto bg-facebook hover:bg-facebook/90"
          >
            <span>Continue</span>
          </Button>
        )}
      </div>

      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-2">Generated Ad Images</h2>
        <p className="text-gray-600 mb-6">
          Review the AI-generated images for your campaign. You can use these in different ad formats.
        </p>
      </div>

      {isGenerating ? (
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-facebook" />
            <p className="text-gray-600">Generating AI images for your campaign...</p>
          </div>
        </Card>
      ) : images.length > 0 ? (
        <Card className="p-6">
          <Carousel className="w-full max-w-3xl mx-auto">
            <CarouselContent>
              {images.map((image, index) => (
                <CarouselItem key={index}>
                  <div className="p-1">
                    <Card>
                      <CardContent className="flex aspect-square items-center justify-center p-6">
                        <img
                          src={image.url}
                          alt={`Generated ad image ${index + 1}`}
                          className="rounded-lg object-cover w-full h-full"
                        />
                      </CardContent>
                    </Card>
                    <p className="text-center text-sm text-gray-500 mt-2">
                      Image {index + 1} of {images.length}
                    </p>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </Card>
      ) : null}
    </div>
  );
};

export default AdFormatStep;