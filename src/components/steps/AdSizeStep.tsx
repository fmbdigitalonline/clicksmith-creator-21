import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AdFormat } from "@/types/adWizard";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FacebookAdFormats from "./ad-formats/FacebookAdFormats";
import GoogleAdFormats from "./ad-formats/GoogleAdFormats";

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
      const { data: creditCheck, error: creditError } = await supabase.rpc(
        'check_user_credits',
        { 
          p_user_id: (await supabase.auth.getUser()).data.user?.id,
          required_credits: 5
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
          <FacebookAdFormats 
            selectedFormat={selectedFormat} 
            onFormatSelect={setSelectedFormat} 
          />
        </TabsContent>

        <TabsContent value="google">
          <GoogleAdFormats 
            selectedFormat={selectedFormat} 
            onFormatSelect={setSelectedFormat} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdSizeStep;