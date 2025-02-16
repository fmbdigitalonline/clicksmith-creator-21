
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
import { Pencil, Image, Check, X } from "lucide-react";

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
  selectedFormat 
}: AdPreviewCardProps) => {
  const [downloadFormat, setDownloadFormat] = useState<"jpg" | "png" | "pdf" | "docx">("jpg");
  const [isSaving, setSaving] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const [isSelectingImage, setIsSelectingImage] = useState(false);
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

  // Get unique images from all variants
  const uniqueImages = Array.from(new Set(
    adVariants
      .map(v => v.imageUrl || v.image?.url)
      .filter(Boolean)
  ));

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
              onClick={() => setIsSelectingImage(!isSelectingImage)}
            >
              <Image className="h-4 w-4 mr-1" /> Change Image
            </Button>
          </div>

          {/* Image Selection Dropdown */}
          {isSelectingImage && uniqueImages.length > 0 && (
            <div className="absolute top-2 right-2 bg-white rounded-lg shadow-lg p-2 z-10">
              <div className="grid grid-cols-2 gap-2">
                {uniqueImages.map((imageUrl, idx) => (
                  <button
                    key={idx}
                    className="w-20 h-20 rounded overflow-hidden border-2 hover:border-primary transition-colors"
                    onClick={() => {
                      variant.imageUrl = imageUrl;
                      setIsSelectingImage(false);
                      toast({
                        title: "Image updated",
                        description: "Your ad image has been changed.",
                      });
                    }}
                  >
                    <img
                      src={imageUrl}
                      alt={`Option ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
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
