import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdHook, AdImage } from "@/types/adWizard";

interface AdVariantCardProps {
  variant?: any;
  image?: AdImage;
  hook?: AdHook;
  index?: number;
  onCreateProject?: () => void;
  isVideo?: boolean;
}

const AD_SIZES = [
  { width: 1200, height: 628, label: "Landscape (1.91:1)" },
  { width: 1080, height: 1080, label: "Square (1:1)" },
  { width: 1080, height: 1920, label: "Vertical (9:16)" }
];

const AdVariantCard = ({ variant, image, hook, onCreateProject, isVideo = false }: AdVariantCardProps) => {
  const [selectedSize, setSelectedSize] = useState(`${AD_SIZES[0].width}x${AD_SIZES[0].height}`);
  const { toast } = useToast();

  const handleDownload = async () => {
    try {
      const imageUrl = image?.variants?.[selectedSize] || image?.url || variant?.url;
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ad-variant-${selectedSize}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download the image. Please try again.",
        variant: "destructive",
      });
    }
  };

  const currentImageUrl = image?.variants?.[selectedSize] || image?.url || variant?.url;
  const [width, height] = selectedSize.split('x').map(Number);

  return (
    <Card className="overflow-hidden">
      <div className="p-4 space-y-4">
        <Select value={selectedSize} onValueChange={setSelectedSize}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select size" />
          </SelectTrigger>
          <SelectContent>
            {AD_SIZES.map((size) => (
              <SelectItem key={`${size.width}x${size.height}`} value={`${size.width}x${size.height}`}>
                {size.label} ({size.width}x{size.height})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div 
          className="relative bg-gray-100 rounded-lg overflow-hidden"
          style={{ 
            aspectRatio: `${width}/${height}`,
            maxHeight: '400px'
          }}
        >
          <img
            src={currentImageUrl}
            alt={`Ad variant ${hook?.text || ''}`}
            className="object-cover w-full h-full"
          />
        </div>

        {hook && (
          <div className="space-y-2">
            <h3 className="font-medium text-lg">{hook.text}</h3>
            <p className="text-gray-600">{hook.description}</p>
          </div>
        )}

        <div className="space-y-4">
          <Button
            onClick={handleDownload}
            className="w-full bg-facebook hover:bg-facebook/90"
          >
            <Download className="w-4 h-4 mr-2" />
            Download {selectedSize}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default AdVariantCard;