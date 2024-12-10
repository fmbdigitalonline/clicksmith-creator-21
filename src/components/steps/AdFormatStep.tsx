import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AdHook } from "../AdWizard";

export type AdFormat = {
  format: string;
  dimensions: {
    width: number;
    height: number;
  };
};

const AD_FORMATS = [
  { label: "Image Ad (Landscape)", value: "image_landscape", width: 1200, height: 628 },
  { label: "Video Ad (Landscape)", value: "video_landscape", width: 1200, height: 628 },
  { label: "Video Ad (Square)", value: "video_square", width: 1080, height: 1080 },
  { label: "Video Ad (Vertical)", value: "video_vertical", width: 1080, height: 1920 },
  { label: "Carousel Ad", value: "carousel", width: 1080, height: 1080 },
  { label: "Stories Ad", value: "stories", width: 1080, height: 1920 },
  { label: "Reels Ad", value: "reels", width: 1080, height: 1920 },
];

interface AdFormatStepProps {
  onNext: (format: AdFormat, hooks: AdHook[]) => void;
  onBack: () => void;
  businessIdea?: any;
  targetAudience?: any;
}

const AdFormatStep = ({ onNext, onBack, businessIdea, targetAudience }: AdFormatStepProps) => {
  const [selectedFormat, setSelectedFormat] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFormatSelect = (value: string) => {
    setSelectedFormat(value);
  };

  const handleNext = async () => {
    if (!selectedFormat) {
      toast({
        title: "Please select a format",
        description: "You need to select an ad format before proceeding.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const format = AD_FORMATS.find((f) => f.value === selectedFormat);

    if (format) {
      try {
        const formatData = {
          format: format.value,
          dimensions: {
            width: format.width,
            height: format.height,
          },
        };

        // Generate hooks
        const { data, error } = await supabase.functions.invoke('generate-ad-content', {
          body: { 
            businessIdea: businessIdea,
            audience: targetAudience,
            format: formatData
          }
        });

        if (error) throw error;

        // Parse the generated content and create hook objects
        const generatedHooks = data.content.split('\n')
          .filter((line: string) => line.trim().length > 0)
          .map((hook: string) => ({
            text: hook.replace(/^\d+\.\s*/, '').trim(),
            description: "AI-generated hook based on your business and audience",
          }));

        // Proceed to next step with both format and hooks
        onNext(formatData, generatedHooks);
      } catch (error) {
        console.error('Error generating hooks:', error);
        toast({
          title: "Error",
          description: "There was an error generating ad hooks. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Choose Ad Format</h2>
        <p className="text-gray-600">
          Select the format that best suits your advertising needs
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Ad Format</label>
            <Select onValueChange={handleFormatSelect} value={selectedFormat || undefined}>
              <SelectTrigger>
                <SelectValue placeholder="Select ad format" />
              </SelectTrigger>
              <SelectContent>
                {AD_FORMATS.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label} ({format.width}x{format.height})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-sm text-gray-500">
            <p>Your ad will be optimized for the selected format and dimensions.</p>
          </div>
        </div>
      </Card>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} className="space-x-2">
          <ArrowLeft className="w-4 h-4" />
          <span>Previous Step</span>
        </Button>
        <Button 
          onClick={handleNext} 
          disabled={!selectedFormat || isLoading}
          className="bg-facebook hover:bg-facebook/90 text-white"
        >
          {isLoading ? "Generating..." : "Next Step"}
        </Button>
      </div>
    </div>
  );
};

export default AdFormatStep;