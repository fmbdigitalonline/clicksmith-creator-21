import { Card } from "@/components/ui/card";
import { AdFormat } from "@/types/adWizard";
import { Check } from "lucide-react";

interface FacebookAdFormatsProps {
  selectedFormat: AdFormat | null;
  onFormatSelect: (format: AdFormat) => void;
}

const FacebookAdFormats = ({ selectedFormat, onFormatSelect }: FacebookAdFormatsProps) => {
  const socialMediaAdFormats = [
    {
      id: "landscape",
      title: "Landscape Image",
      description: "1200 x 628px - Best for social media feed ads",
      format: {
        format: "facebook_landscape",
        dimensions: { width: 1200, height: 628 },
        aspectRatio: "1.91:1",
        description: "Best for social media feed ads",
        platform: "facebook" as const
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
        platform: "facebook" as const
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
        platform: "facebook" as const
      }
    },
    {
      id: "carousel",
      title: "Carousel Image",
      description: "1080 x 1080px - For multi-image carousel ads",
      format: {
        format: "facebook_carousel",
        dimensions: { width: 1080, height: 1080 },
        aspectRatio: "1:1",
        description: "For multi-image carousel ads",
        platform: "facebook" as const
      }
    },
    {
      id: "collection",
      title: "Collection Cover",
      description: "1200 x 628px - For collection ad covers",
      format: {
        format: "facebook_collection",
        dimensions: { width: 1200, height: 628 },
        aspectRatio: "1.91:1",
        description: "For collection ad covers",
        platform: "facebook" as const
      }
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {socialMediaAdFormats.map((format) => {
        const isSelected = selectedFormat?.format === format.format.format;
        return (
          <Card
            key={format.id}
            className={`relative p-6 cursor-pointer transition-all ${
              isSelected
                ? "ring-2 ring-facebook bg-facebook/5"
                : "hover:border-facebook/50 hover:bg-gray-50"
            }`}
            onClick={() => onFormatSelect(format.format)}
          >
            {isSelected && (
              <div className="absolute top-3 right-3">
                <Check className="w-5 h-5 text-facebook" />
              </div>
            )}
            <div className="space-y-2">
              <h3 className="font-semibold">{format.title}</h3>
              <p className="text-sm text-gray-600">{format.description}</p>
              <div className="mt-2 inline-flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {format.format.aspectRatio}
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  );
};

export default FacebookAdFormats;