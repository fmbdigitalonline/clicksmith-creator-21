import { useState, useEffect } from "react";
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
import { Pencil, Check, X, CheckSquare, Square, Loader2 } from "lucide-react";
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
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
}

const AdPreviewCard = ({ 
  variant, 
  adVariants = [],
  onCreateProject, 
  isVideo = false,
  selectedFormat: initialFormat,
  selectable = false,
  selected = false,
  onSelect
}: AdPreviewCardProps) => {
  const [downloadFormat, setDownloadFormat] = useState<"jpg" | "png" | "pdf" | "docx">("jpg");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const [editedHeadline, setEditedHeadline] = useState(variant.headline);
  const [editedDescription, setEditedDescription] = useState(variant.description);
  const [selectedFormat, setSelectedFormat] = useState(initialFormat || variant.size);
  const [imageStatus, setImageStatus] = useState<'pending' | 'processing' | 'ready' | 'failed'>('pending');
  const { toast } = useToast();
  const { projectId } = useParams();
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  useEffect(() => {
    if (variant.id && isProcessingImage) {
      const checkStatus = async () => {
        try {
          const { data, error } = await supabase
            .from('ad_feedback')
            .select('image_status, storage_url')
            .eq('id', variant.id)
            .single();
          
          if (error) throw error;
          
          if (data) {
            const newStatus = data.image_status as 'pending' | 'processing' | 'ready' | 'failed';
            setImageStatus(newStatus);
            
            if (data.image_status === 'ready') {
              setIsProcessingImage(false);
              toast({
                title: "Image Ready",
                description: "Your image has been processed and is ready for Facebook ads.",
              });
            } else if (data.image_status === 'failed') {
              setIsProcessingImage(false);
              toast({
                title: "Image Processing Failed",
                description: "We couldn't process this image for Facebook ads. Try a different image.",
                variant: "destructive",
              });
            }
          }
        } catch (error) {
          console.error('Error checking image status:', error);
        }
      };
      
      checkStatus();
      
      const interval = setInterval(checkStatus, 3000);
      
      return () => clearInterval(interval);
    }
  }, [variant.id, isProcessingImage, toast]);

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
          original_url: imageUrl, // Store original URL for migration
          image_status: 'pending',
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
      
      if (data && data[0]) {
        const adId = data[0].id;
        setIsProcessingImage(true);
        
        try {
          const { error: migrationError } = await supabase.functions.invoke('migrate-images', {
            body: { adId }
          });
          
          if (migrationError) {
            console.error('Migration error:', migrationError);
            toast({
              title: "Image Processing Initiated",
              description: "Your ad is saved. We're processing the image for Facebook compatibility in the background.",
            });
          } else {
            toast({
              title: "Image Processing Started",
              description: "Your ad is saved and image processing has begun. This may take a moment.",
            });
          }
        } catch (invokeError) {
          console.error('Error invoking migrate-images function:', invokeError);
          toast({
            title: "Image Processing Started",
            description: "Your ad is saved. Image processing has started in the background.",
          });
        }
      } else {
        toast({
          title: "Success!",
          description: "Your ad has been saved successfully.",
        });
      }
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

  const handleSelectToggle = () => {
    if (selectable && onSelect) {
      onSelect(variant.id, !selected);
    }
  };

  return (
    <Card className="overflow-hidden relative">
      {selectable && (
        <div 
          className="absolute top-2 left-2 z-10 bg-white bg-opacity-80 rounded-md p-1 cursor-pointer shadow-sm hover:bg-opacity-100 transition-all" 
          onClick={handleSelectToggle}
        >
          {selected ? (
            <CheckSquare className="h-6 w-6 text-primary" />
          ) : (
            <Square className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
      )}
      
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
              status={isProcessingImage ? imageStatus : undefined}
            />
          </div>
          
          {isProcessingImage && (
            <div className="mt-2 bg-blue-50 p-2 rounded-md border border-blue-100">
              <div className="flex items-center gap-2 text-sm text-blue-700">
                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                <span>Processing image for Facebook compatibility...</span>
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
            onSave={handleSave}
            onDownload={handleDownload}
            isSaving={isSaving || isProcessingImage}
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
