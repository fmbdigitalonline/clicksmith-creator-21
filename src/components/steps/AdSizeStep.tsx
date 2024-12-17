import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AdFormat } from "@/types/adWizard";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AdSizeStepProps {
  onNext: (format: AdFormat) => void;
  onBack: () => void;
}

const AdSizeStep = ({ onNext, onBack }: AdSizeStepProps) => {
  const [selectedFormat, setSelectedFormat] = useState<AdFormat | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [platform, setPlatform] = useState<"facebook" | "google">("facebook");
  const { toast } = useToast();

  const handleContinue = async () => {
    if (!selectedFormat) {
      toast({
        title: "Please select a format",
        description: "You must select an ad format to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Check and deduct credits
      const { data: creditCheck, error: creditError } = await supabase.rpc(
        'check_user_credits',
        { 
          p_user_id: (await supabase.auth.getUser()).data.user?.id,
          required_credits: 5 // Cost for image generation
        }
      );

      if (creditError || !creditCheck?.[0]?.has_credits) {
        throw new Error(creditCheck?.[0]?.error_message || 'Insufficient credits');
      }

      onNext(selectedFormat);
    } catch (error) {
      console.error('Error processing request:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process request",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const facebookAdFormats = [
    {
      id: "landscape",
      title: "Landscape Image",
      description: "1200 x 628px - Best for Facebook feed ads",
      format: {
        format: "facebook_landscape",
        dimensions: { width: 1200, height: 628 },
        aspectRatio: "1.91:1",
        description: "Best for Facebook feed ads",
        platform: "facebook"
      }
    },
    {
      id: "square",
      title: "Square Image",
      description: "1080 x 1080px - Great for Instagram feed",
      format: {
        format: "facebook_square",
        dimensions: { width: 1080, height: 1080 },
        aspectRatio: "1:1",
        description: "Great for Instagram feed",
        platform: "facebook"
      }
    },
    {
      id: "story",
      title: "Story Image",
      description: "1080 x 1920px - Perfect for Stories and Reels",
      format: {
        format: "facebook_story",
        dimensions: { width: 1080, height: 1920 },
        aspectRatio: "9:16",
        description: "Perfect for Stories and Reels",
        platform: "facebook"
      }
    },
  ];

  const googleAdFormats = [
    {
      id: "google_horizontal",
      title: "Horizontal Image",
      description: "1200 x 628px - Standard Display Ad",
      format: {
        format: "google_horizontal",
        dimensions: { width: 1200, height: 628 },
        aspectRatio: "1.91:1",
        description: "Standard Display Ad",
        platform: "google"
      }
    },
    {
      id: "google_square",
      title: "Square Image",
      description: "1200 x 1200px - Versatile Square Format",
      format: {
        format: "google_square",
        dimensions: { width: 1200, height: 1200 },
        aspectRatio: "1:1",
        description: "Versatile Square Format",
        platform: "google"
      }
    },
    {
      id: "google_vertical",
      title: "Vertical Image",
      description: "1200 x 1500px - Portrait Display Ad",
      format: {
        format: "google_vertical",
        dimensions: { width: 1200, height: 1500 },
        aspectRatio: "4:5",
        description: "Portrait Display Ad",
        platform: "google"
      }
    },
    {
      id: "google_logo",
      title: "Logo Square",
      description: "1200 x 1200px - Logo Display",
      format: {
        format: "google_logo_square",
        dimensions: { width: 1200, height: 1200 },
        aspectRatio: "1:1",
        description: "Logo Display",
        platform: "google"
      }
    },
    {
      id: "google_logo_wide",
      title: "Logo Wide",
      description: "1200 x 300px - Wide Logo Display",
      format: {
        format: "google_logo_wide",
        dimensions: { width: 1200, height: 300 },
        aspectRatio: "4:1",
        description: "Wide Logo Display",
        platform: "google"
      }
    },
    {
      id: "google_video_horizontal",
      title: "Video Horizontal",
      description: "1920 x 1080px - Landscape Video Ad",
      format: {
        format: "google_video_horizontal",
        dimensions: { width: 1920, height: 1080 },
        aspectRatio: "16:9",
        description: "Landscape Video Ad",
        platform: "google"
      }
    },
    {
      id: "google_video_square",
      title: "Video Square",
      description: "1080 x 1080px - Square Video Ad",
      format: {
        format: "google_video_square",
        dimensions: { width: 1080, height: 1080 },
        aspectRatio: "1:1",
        description: "Square Video Ad",
        platform: "google"
      }
    },
    {
      id: "google_video_vertical",
      title: "Video Vertical",
      description: "1080 x 1920px - Portrait Video Ad",
      format: {
        format: "google_video_vertical",
        dimensions: { width: 1080, height: 1920 },
        aspectRatio: "9:16",
        description: "Portrait Video Ad",
        platform: "google"
      }
    }
  ];

  return (
    <div className="space-y-6">
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
          onClick={handleContinue}
          disabled={!selectedFormat || isProcessing}
          className="space-x-2 w-full md:w-auto bg-facebook hover:bg-facebook/90"
        >
          {isProcessing ? "Processing..." : "Continue"}
        </Button>
      </div>

      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-2">Choose Ad Format</h2>
        <p className="text-gray-600 mb-6">
          Select the platform and format that best suits your campaign objectives.
        </p>
      </div>

      <Tabs defaultValue="facebook" className="w-full" onValueChange={(value) => setPlatform(value as "facebook" | "google")}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="facebook">Facebook Ads</TabsTrigger>
          <TabsTrigger value="google">Google Ads</TabsTrigger>
        </TabsList>
        
        <TabsContent value="facebook">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {facebookAdFormats.map((format) => (
              <Card
                key={format.id}
                className={`p-6 cursor-pointer transition-all ${
                  selectedFormat?.format === format.format.format
                    ? "ring-2 ring-facebook"
                    : "hover:border-facebook/50"
                }`}
                onClick={() => setSelectedFormat(format.format)}
              >
                <h3 className="font-semibold mb-2">{format.title}</h3>
                <p className="text-sm text-gray-600">{format.description}</p>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="google">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {googleAdFormats.map((format) => (
              <Card
                key={format.id}
                className={`p-6 cursor-pointer transition-all ${
                  selectedFormat?.format === format.format.format
                    ? "ring-2 ring-blue-500"
                    : "hover:border-blue-500/50"
                }`}
                onClick={() => setSelectedFormat(format.format)}
              >
                <h3 className="font-semibold mb-2">{format.title}</h3>
                <p className="text-sm text-gray-600">{format.description}</p>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdSizeStep;