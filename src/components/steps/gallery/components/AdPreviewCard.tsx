import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import MediaPreview from "./MediaPreview";
import DownloadControls from "./DownloadControls";
import { AdFeedbackControls } from "./AdFeedbackControls";
import { convertToFormat } from "@/utils/imageUtils";

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
    headline: string;
    description: string;
    callToAction: string;
    id: string;
  };
  onCreateProject: () => void;
  isVideo?: boolean;
  selectedFormat?: { width: number; height: number; label: string; };
}

const AdPreviewCard = ({ variant, onCreateProject, isVideo = false, selectedFormat }: AdPreviewCardProps) => {
  const [downloadFormat, setDownloadFormat] = useState<"jpg" | "png" | "pdf" | "docx">("jpg");
  const [isSaving, setSaving] = useState(false);
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
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const convertedBlob = await convertToFormat(URL.createObjectURL(blob), downloadFormat as "jpg" | "png");
      const url = URL.createObjectURL(convertedBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${variant.platform}-${isVideo ? 'video' : 'ad'}-${selectedFormat?.width || variant.size.width}x${selectedFormat?.height || variant.size.height}.${downloadFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success!",
        description: `Your ${selectedFormat?.label || variant.size.label} ${isVideo ? 'video' : 'ad'} has been downloaded as ${downloadFormat.toUpperCase()}.`,
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

  const handleSaveAndDownload = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User must be logged in to save ad');
      }

      const imageUrl = getImageUrl();
      if (!imageUrl) {
        throw new Error('No image URL available');
      }

      const { error: saveError } = await supabase
        .from('ad_feedback')
        .insert({
          user_id: user.id,
          project_id: projectId,
          saved_images: [imageUrl],
          feedback: 'saved'
        });

      if (saveError) throw saveError;

      await handleDownload();
      
      toast({
        title: "Success!",
        description: "Ad saved to your gallery and downloaded successfully.",
      });
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
      <div className="space-y-3">
        {/* Description */}
        <div className="p-4 bg-facebook/5 rounded-lg">
          <p className="text-sm font-medium text-facebook mb-1">Ad Copy:</p>
          <p className="text-gray-800">{variant.description}</p>
        </div>

        {/* Image Preview */}
        <div 
          style={{ 
            aspectRatio: `${selectedFormat?.width || variant.size.width} / ${selectedFormat?.height || variant.size.height}`,
            maxHeight: '600px',
            transition: 'aspect-ratio 0.3s ease-in-out'
          }} 
          className="relative group rounded-lg overflow-hidden"
        >
          <MediaPreview
            imageUrl={getImageUrl()}
            isVideo={isVideo}
            format={selectedFormat || variant.size}
          />
        </div>

        {/* Headline */}
        <div className="px-4 bg-gray-50 py-3 rounded-lg">
          <p className="text-sm font-medium text-gray-600 mb-1">Headline:</p>
          <p className="text-gray-800 font-medium">{variant.headline}</p>
        </div>

        {/* Controls and Feedback */}
        <div className="px-4 py-3 space-y-3">
          <DownloadControls
            downloadFormat={downloadFormat}
            onFormatChange={(value) => setDownloadFormat(value as "jpg" | "png" | "pdf" | "docx")}
            onSaveAndDownload={handleSaveAndDownload}
            isSaving={isSaving}
          />
          <AdFeedbackControls
            adId={variant.id}
            projectId={projectId}
          />
        </div>
      </div>
    </Card>
  );
};

export default AdPreviewCard;
