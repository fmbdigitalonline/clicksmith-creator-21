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
import { generatePDF, generateWord } from "@/utils/documentGenerators";

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
}

const AdPreviewCard = ({ variant, onCreateProject, isVideo = false }: AdPreviewCardProps) => {
  const [isSaving, setSaving] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<"jpg" | "png" | "pdf" | "docx">("jpg");
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

  const handleVideoPlayPause = (videoElement: HTMLVideoElement) => {
    if (videoElement.paused) {
      videoElement.play();
      setIsPlaying(true);
    } else {
      videoElement.pause();
      setIsPlaying(false);
    }
  };

  const handleDownload = async () => {
    const imageUrl = getImageUrl();
    if (!imageUrl) {
      toast({
        title: "Error",
        description: "No image URL available for download",
        variant: "destructive",
      });
      return;
    }

    try {
      switch (downloadFormat) {
        case "pdf":
          await generatePDF(variant, imageUrl);
          break;
        case "docx":
          await generateWord(variant, imageUrl);
          break;
        default:
          // Handle image downloads (jpg/png)
          const response = await fetch(imageUrl);
          const originalBlob = await response.blob();
          const convertedBlob = await convertToFormat(URL.createObjectURL(originalBlob), downloadFormat as "jpg" | "png");
          const url = URL.createObjectURL(convertedBlob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${variant.platform}-${isVideo ? 'video' : 'ad'}-${variant.size.width}x${variant.size.height}.${downloadFormat}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
      }

      toast({
        title: "Success!",
        description: `Your ${variant.size.label} ${isVideo ? 'video' : 'ad'} has been downloaded as ${downloadFormat.toUpperCase()}.`,
      });
    } catch (error) {
      console.error('Error downloading:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to download file.",
        variant: "destructive",
      });
    }
  };

  const convertToFormat = async (url: string, format: "jpg" | "png"): Promise<Blob> => {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');
    ctx.drawImage(img, 0, 0);

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

  const handleSaveAndDownload = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User must be logged in to save ad');
      }

      if (!onCreateProject) {
        toast({
          title: "No Project Selected",
          description: "Please create a project to save your ad.",
          action: (
            <Button variant="outline" onClick={onCreateProject}>
              Create Project
            </Button>
          ),
        });
        return;
      }

      await handleDownload();
    } catch (error) {
      console.error('Error saving ad:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save ad or download file.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div 
        style={{ 
          aspectRatio: `${variant.size.width} / ${variant.size.height}`,
          maxHeight: '400px'
        }} 
        className="relative group"
      >
        {isVideo ? (
          imageUrl ? (
            <>
              <video
                src={imageUrl}
                className="object-cover w-full h-full cursor-pointer"
                playsInline
                preload="metadata"
                onClick={(e) => handleVideoPlayPause(e.currentTarget)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  const video = e.currentTarget.parentElement?.querySelector('video');
                  if (video) handleVideoPlayPause(video);
                }}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <p className="text-gray-500">Video preview not available</p>
            </div>
          )
        ) : (
          imageUrl ? (
            <img
              src={imageUrl}
              alt={variant.headline}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100">
              <p className="text-gray-500">Image preview not available</p>
            </div>
          )
        )}
      </div>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-lg">{variant.headline}</h3>
            <span className="text-sm text-gray-500">{variant.size.label}</span>
          </div>
          <p className="text-gray-600">{variant.description}</p>
          <p className="text-facebook font-medium">{variant.callToAction}</p>
          <div className="text-sm text-gray-500 space-y-1">
            <p>Size: {variant.size.width}x{variant.size.height}</p>
            {variant.specs?.designRecommendations && (
              <>
                <p>Format: {variant.specs.designRecommendations.fileTypes.join(", ")}</p>
                <p>Aspect Ratio: {variant.specs.designRecommendations.aspectRatios}</p>
              </>
            )}
            {isVideo && (
              <p>Type: Video Ad</p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Select
            value={downloadFormat}
            onValueChange={(value: "jpg" | "png" | "pdf" | "docx") => setDownloadFormat(value)}
          >
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jpg">JPG</SelectItem>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="docx">Word</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={handleSaveAndDownload}
            className="flex-1 bg-facebook hover:bg-facebook/90"
            disabled={isSaving}
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
