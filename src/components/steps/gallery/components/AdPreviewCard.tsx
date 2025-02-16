
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import MediaPreview from "./MediaPreview";
import AdDetails from "./AdDetails";
import DownloadControls from "./DownloadControls";
import { AdFeedbackControls } from "./AdFeedbackControls";
import { convertToFormat } from "@/utils/imageUtils";
import { Pencil, ImagePlus, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

interface GeneratedAd {
  id: string;
  headline: string;
  description: string;
  imageUrl?: string;
  // ... add other properties as needed
}

const AdPreviewCard = ({ 
  variant, 
  adVariants = [],
  onCreateProject, 
  isVideo = false,
  selectedFormat 
}: AdPreviewCardProps) => {
  const [downloadFormat, setDownloadFormat] = useState<"jpg" | "png" | "pdf" | "docx">("jpg");
  const [isSaving, setSaving] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [editedHeadline, setEditedHeadline] = useState(variant.headline);
  const [editedDescription, setEditedDescription] = useState(variant.description);
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

  const handleSaveTextEdits = async () => {
    setIsEditingText(false);
    variant.headline = editedHeadline;
    variant.description = editedDescription;

    if (projectId && projectId !== 'new') {
      try {
        const { data: project } = await supabase
          .from('projects')
          .select('generated_ads')
          .eq('id', projectId)
          .single();

        if (project?.generated_ads && Array.isArray(project.generated_ads)) {
          const updatedAds = (project.generated_ads as GeneratedAd[]).map((ad) => {
            if (ad.id === variant.id) {
              return {
                ...ad,
                headline: editedHeadline,
                description: editedDescription
              };
            }
            return ad;
          });

          await supabase
            .from('projects')
            .update({ generated_ads: updatedAds })
            .eq('id', projectId);
        }
      } catch (error) {
        console.error('Error updating ad:', error);
      }
    }

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

  const handleGenerateNewImage = async () => {
    setIsGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ad-content', {
        body: {
          type: 'images',
          platform: variant.platform,
          description: editedDescription,
          headline: editedHeadline,
          format: selectedFormat || variant.size
        }
      });

      if (error) throw error;

      if (data?.images?.[0]?.url) {
        variant.imageUrl = data.images[0].url;
        
        // Update project if we have a project ID
        if (projectId && projectId !== 'new') {
          const { data: project } = await supabase
            .from('projects')
            .select('generated_ads')
            .eq('id', projectId)
            .single();

          if (project?.generated_ads && Array.isArray(project.generated_ads)) {
            const updatedAds = (project.generated_ads as GeneratedAd[]).map((ad) => {
              if (ad.id === variant.id) {
                return {
                  ...ad,
                  imageUrl: data.images[0].url
                };
              }
              return ad;
            });

            await supabase
              .from('projects')
              .update({ generated_ads: updatedAds })
              .eq('id', projectId);
          }
        }

        toast({
          title: "New image generated",
          description: "Your ad image has been updated with a new concept.",
        });
      }
    } catch (error) {
      console.error('Error generating new image:', error);
      toast({
        title: "Error generating image",
        description: "Failed to generate a new image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 space-y-4">
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
              aspectRatio: `${selectedFormat?.width || variant.size.width} / ${selectedFormat?.height || variant.size.height}`,
              maxHeight: '600px'
            }} 
            className="relative group rounded-lg overflow-hidden"
          >
            <MediaPreview
              imageUrl={getImageUrl()}
              isVideo={isVideo}
              format={selectedFormat || variant.size}
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={handleGenerateNewImage}
              disabled={isGeneratingImage}
            >
              <ImagePlus className="h-4 w-4 mr-1" /> 
              {isGeneratingImage ? "Generating..." : "Generate New Image"}
            </Button>
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
              className="font-semibold text-facebook"
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
            onSave={() => {}}
            onDownload={() => {}}
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
