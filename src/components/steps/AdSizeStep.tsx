import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AdFormat } from "@/types/adWizard";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AdSizeStepProps {
  onNext: (format: AdFormat) => void;
  onBack: () => void;
}

const AdSizeStep = ({ onNext, onBack }: AdSizeStepProps) => {
  const [selectedFormat, setSelectedFormat] = useState<AdFormat | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
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

  const adFormats: { id: AdFormat; title: string; description: string }[] = [
    {
      id: "image_landscape",
      title: "Landscape Image",
      description: "1200 x 628px - Best for Facebook feed ads",
    },
    {
      id: "image_square",
      title: "Square Image",
      description: "1080 x 1080px - Great for Instagram feed",
    },
    {
      id: "image_story",
      title: "Story Image",
      description: "1080 x 1920px - Perfect for Stories and Reels",
    },
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
          Select the format that best suits your campaign objectives and target platforms.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {adFormats.map((format) => (
          <Card
            key={format.id}
            className={`p-6 cursor-pointer transition-all ${
              selectedFormat === format.id
                ? "ring-2 ring-facebook"
                : "hover:border-facebook/50"
            }`}
            onClick={() => setSelectedFormat(format.id)}
          >
            <h3 className="font-semibold mb-2">{format.title}</h3>
            <p className="text-sm text-gray-600">{format.description}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdSizeStep;