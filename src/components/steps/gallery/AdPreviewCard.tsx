import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button"; // Added this import
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import { generatePDF, generateWord } from "@/utils/documentGenerators";
import MediaPreview from "./components/MediaPreview";
import AdDetails from "./components/AdDetails";
import DownloadControls from "./components/DownloadControls";

import { AdHook } from "@/types/adWizard";

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
  const [downloadFormat, setDownloadFormat] = useState<"jpg" | "png" | "pdf" | "docx">("jpg");
  const { toast } = useToast();
  const { projectId } = useParams();

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
    } else {
      videoElement.pause();
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

  const imageUrl = getImageUrl();

  return (
    <Card className="overflow-hidden">
      <div 
        style={{ 
          aspectRatio: `${variant.size.width} / ${variant.size.height}`,
          maxHeight: '400px'
        }} 
        className="relative group"
      >
        <MediaPreview
          imageUrl={imageUrl}
          isVideo={isVideo}
          onVideoPlayPause={handleVideoPlayPause}
        />
      </div>
      <CardContent className="p-4 space-y-4">
        <AdDetails variant={variant} isVideo={isVideo} />
        <DownloadControls
          downloadFormat={downloadFormat}
          onFormatChange={(value) => setDownloadFormat(value)}
          onSaveAndDownload={handleSaveAndDownload}
          isSaving={isSaving}
        />
      </CardContent>
    </Card>
  );
};

export default AdPreviewCard;
