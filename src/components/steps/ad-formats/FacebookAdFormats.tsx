import { Card } from "@/components/ui/card";
import { AdFormat } from "@/types/adWizard";

interface FacebookAdFormatsProps {
  selectedFormat: AdFormat | null;
  onFormatSelect: (format: AdFormat) => void;
}

const FacebookAdFormats = ({ selectedFormat, onFormatSelect }: FacebookAdFormatsProps) => {
  const facebookAdFormats = [
    {
      id: "landscape",
      title: "Landscape Image",
      description: "1200 x 628px - Best for Facebook feed ads",
      format: {
        type: "image",
        format: "facebook_landscape",
        dimensions: { width: 1200, height: 628 },
        aspectRatio: "1.91:1",
        description: "Best for Facebook feed ads",
        platform: "facebook" as const
      }
    },
    {
      id: "square",
      title: "Square Image",
      description: "1080 x 1080px - Great for Instagram feed",
      format: {
        type: "image",
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
        type: "image",
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
        type: "image",
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
        type: "image",
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
      {facebookAdFormats.map((format) => (
        <Card
          key={format.id}
          className={`p-6 cursor-pointer transition-all ${
            selectedFormat?.format === format.format.format
              ? "ring-2 ring-facebook"
              : "hover:border-facebook/50"
          }`}
          onClick={() => onFormatSelect(format.format)}
        >
          <h3 className="font-semibold mb-2">{format.title}</h3>
          <p className="text-sm text-gray-600">{format.description}</p>
        </Card>
      ))}
    </div>
  );
};

export default FacebookAdFormats;
