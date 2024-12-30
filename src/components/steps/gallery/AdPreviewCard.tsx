import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Save, Play, Pause } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdPreviewImage from "./AdPreviewImage";
import AdPreviewVideo from "./AdPreviewVideo";
import AdPreviewControls from "./AdPreviewControls";
import AdPreviewDetails from "./AdPreviewDetails";

interface AdPreviewCardProps {
  variant: {
    platform: string;
    image?: {
      url: string;
      prompt: string;
    };
    imageUrl?: string;
    size: {
      width: number;
      height: number;
      label: string;
    };
    specs?: {
      designRecommendations?: {
        fileTypes: string[];
        aspectRatios: string;
      };
      textRecommendations?: {
        primaryTextLength: string;
        headlineLength: string;
      };
    };
    headline: string;
    description: string;
    callToAction: string;
  };
  onCreateProject: () => void;
  isVideo?: boolean;
  resizingOptions?: Array<{
    width: number;
    height: number;
    label: string;
  }>;
}

const AdPreviewCard = ({ variant, onCreateProject, isVideo = false, resizingOptions = [] }: AdPreviewCardProps) => {
  const [isSaving, setSaving] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<"jpg" | "png">("jpg");
  const [selectedSize, setSelectedSize] = useState(resizingOptions[0] || variant.size);
  const { toast } = useToast();

  const getImageUrl = () => {
    if (variant.image?.url) {
      return variant.image.url;
    }
    if (variant.imageUrl) {
      return variant.imageUrl;
    }
    return null;
  };

  const imageUrl = getImageUrl();

  const handleSaveAndDownload = async () => {
    if (!imageUrl) {
      toast({
        title: "Error",
        description: "No image URL available for download",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User must be logged in to save ad');
      }

      const response = await fetch(imageUrl);
      const originalBlob = await response.blob();
      const convertedBlob = await convertToFormat(originalBlob, downloadFormat);
      
      const url = URL.createObjectURL(convertedBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${variant.platform}-${isVideo ? 'video' : 'ad'}-${selectedSize.width}x${selectedSize.height}.${downloadFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success!",
        description: `Your ${selectedSize.label} ${isVideo ? 'video' : 'ad'} has been saved and downloaded as ${downloadFormat.toUpperCase()}.`,
      });
    } catch (error) {
      console.error('Error saving ad:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save ad or download image.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const convertToFormat = async (blob: Blob, format: "jpg" | "png"): Promise<Blob> => {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = URL.createObjectURL(blob);
    });

    const canvas = document.createElement('canvas');
    canvas.width = selectedSize.width;
    canvas.height = selectedSize.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    ctx.drawImage(img, 0, 0, selectedSize.width, selectedSize.height);

    const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
    const quality = format === 'jpg' ? 0.9 : undefined;
    
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to convert image'));
        },
        mimeType,
        quality
      );
    });
  };

  return (
    <Card className="overflow-hidden">
      <div 
        style={{ 
          aspectRatio: `${selectedSize.width} / ${selectedSize.height}`,
          maxHeight: '400px'
        }} 
        className="relative group"
      >
        {isVideo ? (
          <AdPreviewVideo
            imageUrl={imageUrl}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            selectedSize={selectedSize}
          />
        ) : (
          <AdPreviewImage
            imageUrl={imageUrl}
            selectedSize={selectedSize}
          />
        )}
      </div>
      <CardContent className="p-4 space-y-4">
        <AdPreviewDetails
          variant={variant}
          selectedSize={selectedSize}
          isVideo={isVideo}
        />

        <div className="flex gap-2">
          {resizingOptions.length > 0 && (
            <Select
              value={`${selectedSize.width}x${selectedSize.height}`}
              onValueChange={(value) => {
                const [width, height] = value.split('x').map(Number);
                const size = resizingOptions.find(s => s.width === width && s.height === height);
                if (size) setSelectedSize(size);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {resizingOptions.map((size) => (
                  <SelectItem 
                    key={`${size.width}x${size.height}`} 
                    value={`${size.width}x${size.height}`}
                  >
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

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
            onClick={handleSaveAndDownload}
            className="flex-1 bg-facebook hover:bg-facebook/90"
            disabled={isSaving || !imageUrl}
          >
            {isSaving ? (
              "Saving..."
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save & Download
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdPreviewCard;