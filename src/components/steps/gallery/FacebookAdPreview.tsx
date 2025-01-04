import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface FacebookAdPreviewProps {
  variant: any;
  onCreateProject: () => void;
  isVideo?: boolean;
}

const AD_FORMATS = [
  { width: 1200, height: 628, label: "Landscape (1.91:1)" },
  { width: 1080, height: 1080, label: "Square (1:1)" },
  { width: 1080, height: 1920, label: "Story (9:16)" }
];

const FacebookAdPreview = ({ variant, onCreateProject, isVideo = false }: FacebookAdPreviewProps) => {
  const [selectedFormat, setSelectedFormat] = useState(AD_FORMATS[0]);
  const [downloadFormat, setDownloadFormat] = useState<"jpg" | "png">("jpg");

  const handleDownload = async () => {
    try {
      const response = await fetch(variant.imageUrl || variant.image?.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `facebook-ad-${selectedFormat.width}x${selectedFormat.height}.${downloadFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center mb-4">
          <Select
            value={`${selectedFormat.width}x${selectedFormat.height}`}
            onValueChange={(value) => {
              const [width, height] = value.split('x').map(Number);
              const format = AD_FORMATS.find(f => f.width === width && f.height === height);
              if (format) setSelectedFormat(format);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              {AD_FORMATS.map((format) => (
                <SelectItem 
                  key={`${format.width}x${format.height}`} 
                  value={`${format.width}x${format.height}`}
                >
                  {format.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Primary Text Section - Now before the image */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">Primary Text:</p>
          <p className="text-gray-800">{variant.primaryText || variant.description}</p>
        </div>

        {/* Image Preview */}
        <div 
          className="relative rounded-lg overflow-hidden bg-gray-100"
          style={{
            aspectRatio: `${selectedFormat.width}/${selectedFormat.height}`,
            maxHeight: '600px'
          }}
        >
          {isVideo ? (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <p className="text-gray-500">Video Preview</p>
            </div>
          ) : (
            variant.imageUrl && (
              <img
                src={variant.imageUrl}
                alt="Ad preview"
                className="object-cover w-full h-full"
              />
            )
          )}
        </div>

        {/* Headline Section */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-600">Headline:</p>
          <h3 className="text-lg font-semibold text-facebook">
            {variant.headline || variant.hook?.text}
          </h3>
        </div>

        {/* Download Controls */}
        <div className="flex gap-2 mt-4">
          <Select
            value={downloadFormat}
            onValueChange={(value: "jpg" | "png") => setDownloadFormat(value)}
          >
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jpg">JPG</SelectItem>
              <SelectItem value="png">PNG</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            className="flex-1 bg-facebook hover:bg-facebook/90"
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Ad
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default FacebookAdPreview;