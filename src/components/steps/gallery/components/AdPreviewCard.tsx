
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import MediaPreview from "./MediaPreview";
import AdDetails from "./AdDetails";
import DownloadControls from "./DownloadControls";
import { AdFeedbackControls } from "./AdFeedbackControls";
import { convertImage } from "@/utils/imageUtils";
import { Pencil, Check, X } from "lucide-react";
import { useAdPersistence } from "@/hooks/gallery/useAdPersistence";
import { AdSizeSelector, AD_FORMATS } from "../components/AdSizeSelector";

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
    id: string;
  };
  adVariants?: any[];
  onCreateProject: () => void;
  isVideo?: boolean;
  selectedFormat?: { width: number; height: number; label: string };
}

const AdPreviewCard = ({ 
  variant, 
  adVariants = [],
  onCreateProject, 
  isVideo = false,
  selectedFormat: initialFormat
}: AdPreviewCardProps) => {
  const [downloadFormat, setDownloadFormat] = useState<"jpg" | "png" | "pdf" | "docx">("jpg");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const [editedHeadline, setEditedHeadline] = useState(variant.headline);
  const [editedDescription, setEditedDescription] = useState(variant.description);
  const [selectedFormat, setSelectedFormat] = useState(initialFormat || variant.size);
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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Auth error:', authError);
        throw new Error('Authentication error');
      }
      
      if (!user) {
        throw new Error('User must be logged in to save ad');
      }

      const imageUrl = getImageUrl();
      if (!imageUrl) {
        throw new Error('No image URL available to save');
      }

      console.log('Saving ad with data:', {
        user_id: user.id,
        project_id: projectId,
        saved_images: [imageUrl],
        primary_text: editedDescription,
        headline: editedHeadline,
        imageUrl: imageUrl,
        platform: variant.platform,
        size: selectedFormat
      });

      const { data, error } = await supabase
        .from('ad_feedback')
        .insert({
          user_id: user.id,
          project_id: projectId,
          saved_images: [imageUrl],
          primary_text: editedDescription,
          headline: editedHeadline,
          imageUrl: imageUrl,
          platform: variant.platform,
          size: selectedFormat,
          feedback: 'saved',
          rating: 5
        })
        .select();

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      console.log('Successfully saved ad:', data);

      toast({
        title: "Success!",
        description: "Your ad has been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving ad:', error);
      toast({
        title: "Error",
        description: error instanceof Error 
          ? `Failed to save ad: ${error.message}` 
          : "Failed to save ad. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTextEdits = () => {
    setIsEditingText(false);
    toast({
      title: "Changes saved",
      description: "Your ad text has been updated.",
    });
  };

  const handleCancelTextEdits = () => {
    setIsEditingText(false);
    setEditedHeadline(variant.headline);
    setEditedDescription(variant.description);
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
      const blob = await convertImage(imageUrl, downloadFormat, { ...variant, size: selectedFormat });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${variant.platform}-ad-${selectedFormat.width}x${selectedFormat.height}.${downloadFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

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

  const handleFormatChange = (format: typeof AD_FORMATS[0]) => {
    setSelectedFormat(format);
    toast({
      title: "Format updated",
      description: `Ad format changed to ${format.label}`,
    });
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 space-y-4">
        {/* Format Selector */}
        <div className="flex justify-end mb-2">
          <AdSizeSelector
            selectedFormat={selectedFormat}
            onFormatChange={handleFormatChange}
          />
        </div>

        {/* Primary Text Section */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-gray-600">Primary Text:</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditingText(!isEditingText)}
            >
              {isEditingText ? <Check className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
            </Button>
          </div>
          {isEditingText ? (
            <div className="space-y-2">
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="min-h-[100px]"
              />
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelTextEdits}
                >
                  <X className="h-4 w-4 mr-1" /> Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveTextEdits}
                >
                  <Check className="h-4 w-4 mr-1" /> Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-800">{editedDescription}</p>
          )}
        </div>

        {/* Image Section */}
        <div className="relative">
          <div 
            style={{ 
              aspectRatio: `${selectedFormat.width} / ${selectedFormat.height}`,
              maxHeight: '600px'
            }} 
            className="relative rounded-lg overflow-hidden"
          >
            <MediaPreview
              imageUrl={getImageUrl()}
              isVideo={isVideo}
              format={selectedFormat}
            />
          </div>
        </div>

        {/* Headline Section */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <p className="text-sm font-medium text-gray-600">Headline:</p>
          </div>
          {isEditingText ? (
            <Input
              value={editedHeadline}
              onChange={(e) => setEditedHeadline(e.target.value)}
            />
          ) : (
            <h3 className="text-lg font-semibold text-facebook">
              {editedHeadline}
            </h3>
          )}
        </div>

        <CardContent className="p-4 space-y-4">
          <DownloadControls
            downloadFormat={downloadFormat}
            onFormatChange={(value) => setDownloadFormat(value as "jpg" | "png" | "pdf" | "docx")}
            onSave={handleSave}
            onDownload={handleDownload}
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

