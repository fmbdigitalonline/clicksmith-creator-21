import { Card } from "@/components/ui/card";
import { AdFormat } from "@/types/adWizard";

interface GoogleAdFormatsProps {
  selectedFormat: AdFormat | null;
  onFormatSelect: (format: AdFormat) => void;
}

const GoogleAdFormats = ({ selectedFormat, onFormatSelect }: GoogleAdFormatsProps) => {
  const googleAdFormats = [
    {
      id: "google_horizontal",
      title: "Horizontal Image",
      description: "1200 x 628px - Standard Display Ad",
      format: {
        type: "image",
        format: "google_horizontal",
        dimensions: { width: 1200, height: 628 },
        aspectRatio: "1.91:1",
        description: "Standard Display Ad",
        platform: "google" as const
      }
    },
    {
      id: "google_square",
      title: "Square Image",
      description: "1200 x 1200px - Versatile Square Format",
      format: {
        type: "image",
        format: "google_square",
        dimensions: { width: 1200, height: 1200 },
        aspectRatio: "1:1",
        description: "Versatile Square Format",
        platform: "google" as const
      }
    },
    {
      id: "google_vertical",
      title: "Vertical Image",
      description: "1200 x 1500px - Portrait Display Ad",
      format: {
        type: "image",
        format: "google_vertical",
        dimensions: { width: 1200, height: 1500 },
        aspectRatio: "4:5",
        description: "Portrait Display Ad",
        platform: "google" as const
      }
    },
    {
      id: "google_logo",
      title: "Logo Square",
      description: "1200 x 1200px - Logo Display",
      format: {
        type: "image",
        format: "google_logo_square",
        dimensions: { width: 1200, height: 1200 },
        aspectRatio: "1:1",
        description: "Logo Display",
        platform: "google" as const
      }
    },
    {
      id: "google_logo_wide",
      title: "Logo Wide",
      description: "1200 x 300px - Wide Logo Display",
      format: {
        type: "image",
        format: "google_logo_wide",
        dimensions: { width: 1200, height: 300 },
        aspectRatio: "4:1",
        description: "Wide Logo Display",
        platform: "google" as const
      }
    },
    {
      id: "google_video_horizontal",
      title: "Video Horizontal",
      description: "1920 x 1080px - Landscape Video Ad",
      format: {
        type: "video",
        format: "google_video_horizontal",
        dimensions: { width: 1920, height: 1080 },
        aspectRatio: "16:9",
        description: "Landscape Video Ad",
        platform: "google" as const
      }
    },
    {
      id: "google_video_square",
      title: "Video Square",
      description: "1080 x 1080px - Square Video Ad",
      format: {
        type: "video",
        format: "google_video_square",
        dimensions: { width: 1080, height: 1080 },
        aspectRatio: "1:1",
        description: "Square Video Ad",
        platform: "google" as const
      }
    },
    {
      id: "google_video_vertical",
      title: "Video Vertical",
      description: "1080 x 1920px - Portrait Video Ad",
      format: {
        type: "video",
        format: "google_video_vertical",
        dimensions: { width: 1080, height: 1920 },
        aspectRatio: "9:16",
        description: "Portrait Video Ad",
        platform: "google" as const
      }
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {googleAdFormats.map((format) => (
        <Card
          key={format.id}
          className={`p-6 cursor-pointer transition-all ${
            selectedFormat?.format === format.format.format
              ? "ring-2 ring-blue-500"
              : "hover:border-blue-500/50"
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

export default GoogleAdFormats;
