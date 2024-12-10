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
  { 
    label: "Facebook News Feed Image", 
    value: "fb_feed_image", 
    width: 1080, 
    height: 1080,
    description: "Single image ad optimized for Facebook News Feed (1:1 to 1.91:1 ratio supported)"
  },
  { 
    label: "Instagram Feed Image", 
    value: "ig_feed_image", 
    width: 1080, 
    height: 1080,
    description: "Square image perfect for Instagram Feed (1:1 ratio)"
  },
  { 
    label: "Facebook News Feed Video", 
    value: "fb_feed_video", 
    width: 1080, 
    height: 1080,
    description: "Video ad for Facebook Feed (1:1 ratio, 4:5 for mobile)"
  },
  { 
    label: "Instagram Feed Video", 
    value: "ig_feed_video", 
    width: 1080, 
    height: 1350,
    description: "Video optimized for Instagram Feed (4:5 ratio)"
  },
  { 
    label: "Facebook Video Feeds", 
    value: "fb_video_feeds", 
    width: 1080, 
    height: 1350,
    description: "Video for Facebook Feeds (4:5 ratio recommended)"
  },
  { 
    label: "Meta Stories", 
    value: "meta_stories", 
    width: 1080, 
    height: 1920,
    description: "Full-screen vertical format for Stories (9:16 ratio)"
  },
  { 
    label: "Meta Reels", 
    value: "meta_reels", 
    width: 1080, 
    height: 1920,
    description: "Vertical video format for Reels (9:16 ratio)"
  },
  { 
    label: "Messenger Sponsored", 
    value: "messenger_sponsored", 
    width: 1200, 
    height: 628,
    description: "Sponsored messages for Messenger (1.91:1 ratio)"
  },
  { 
    label: "Messenger Inbox", 
    value: "messenger_inbox", 
    width: 1080, 
    height: 1080,
    description: "Square format for Messenger inbox ads (1:1 ratio)"
  }
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
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedFormat && (
            <div className="text-sm text-gray-500">
              <p>{AD_FORMATS.find(f => f.value === selectedFormat)?.description}</p>
              <p className="mt-2">
                Dimensions: {AD_FORMATS.find(f => f.value === selectedFormat)?.width}x
                {AD_FORMATS.find(f => f.value === selectedFormat)?.height}px
              </p>
            </div>
          )}
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