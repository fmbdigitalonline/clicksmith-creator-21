import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import MediaPreview from "./MediaPreview";
import AdDetails from "./AdDetails";
import DownloadControls from "./DownloadControls";
import { AdFeedbackControls } from "./AdFeedbackControls";
import { AdSizeSelector, AD_FORMATS } from "./AdSizeSelector";
import { convertToFormat } from "@/utils/imageUtils";
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
    id: string;
  };
  onCreateProject: () => void;
  isVideo?: boolean;
}

const AdPreviewCard = ({ variant, onCreateProject, isVideo = false }: AdPreviewCardProps) => {
  const [selectedFormat, setSelectedFormat] = useState(AD_FORMATS[0]);
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

  const handleFormatChange = (format: { width: number; height: number; label: string }) => {
    setSelectedFormat(format);
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
          link.download = `${variant.platform}-${isVideo ? 'video' : 'ad'}-${selectedFormat.width}x${selectedFormat.height}.${downloadFormat}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
      }

      toast({
        title: "Success!",
        description: `Your ${selectedFormat.label} ${isVideo ? 'video' : 'ad'} has been downloaded as ${downloadFormat.toUpperCase()}.`,
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

      // Save the ad to user's favorites
      const { error: saveError } = await supabase
        .from('ad_feedback')
        .insert({
          user_id: user.id,
          project_id: projectId,
          saved_images: [getImageUrl()],
          feedback: 'saved'
        });

      if (saveError) throw saveError;

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
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-center mb-4">
          <AdSizeSelector
            selectedFormat={selectedFormat}
            onFormatChange={handleFormatChange}
          />
        </div>

        <div 
          style={{ 
            aspectRatio: `${selectedFormat.width} / ${selectedFormat.height}`,
            maxHeight: '600px'
          }} 
          className="relative group"
        >
          <MediaPreview
            imageUrl={getImageUrl()}
            isVideo={isVideo}
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
          <AdFeedbackControls
            adId={variant.id}
            projectId={projectId}
          />
        </CardContent>
      </div>
    </Card>
  );
};

export default AdPreviewCard;
