
import { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Heart, Video, MessageSquare, MoreHorizontal, Star, Upload, Edit, Image } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import MediaPreview from "@/components/steps/gallery/components/MediaPreview";
import { useTranslation } from "react-i18next";
import { AdQuickActions } from "./AdQuickActions";
import { AdSize, FacebookAdSettings } from "@/types/campaignTypes";
import { AdSizeSelector } from "@/components/steps/gallery/components/AdSizeSelector";
import { uploadMedia, updateAdImage } from "@/utils/uploadUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface SavedAdCardProps {
  id: string;
  headline?: string;
  primaryText?: string;
  imageUrl?: string;
  storage_url?: string;
  image_status?: 'pending' | 'processing' | 'ready' | 'failed';
  platform?: string;
  size?: AdSize;
  projectId?: string;
  onFeedbackSubmit: () => Promise<void>;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  onRegenerateImage?: (adId: string, prompt?: string) => Promise<void>;
  media_type?: 'image' | 'video';
  fb_ad_settings?: FacebookAdSettings;
  projectUrl?: string;
  onSettingsSaved?: (settings: FacebookAdSettings, adId: string, applyToAll?: boolean) => Promise<void>;
}

export const SavedAdCard = ({
  id,
  headline,
  primaryText,
  imageUrl,
  storage_url,
  image_status = 'ready',
  platform = 'facebook',
  size = { width: 1080, height: 1080, label: "Square" },
  projectId,
  onFeedbackSubmit,
  selectable = false,
  selected = false,
  onSelect,
  onRegenerateImage,
  media_type = 'image',
  fb_ad_settings,
  projectUrl,
  onSettingsSaved
}: SavedAdCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showFullText, setShowFullText] = useState(false);
  const { t } = useTranslation(["gallery", "common"]);
  const [isUploading, setIsUploading] = useState(false);
  const [isFormatDialogOpen, setIsFormatDialogOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<AdSize>(size);
  const [isEditMode, setIsEditMode] = useState(false);
  const { toast } = useToast();
  
  // Handle format change
  const handleFormatChange = (newFormat: AdSize) => {
    setSelectedFormat(newFormat);
    toast({
      title: t("format_updated"),
      description: `${t("format_changed_to")} ${newFormat.label}`,
    });
  };
  
  // Handle processing image
  const handleProcessImage = () => {
    if (onRegenerateImage) {
      onRegenerateImage(id, primaryText);
    }
  };

  // Handle media upload
  const handleUploadMedia = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsUploading(true);

    try {
      const { url, isVideo } = await uploadMedia(file);
      
      await updateAdImage(id, url, isVideo);
      toast({
        title: t("upload_success", { ns: "common" }),
        description: isVideo 
          ? t("video_uploaded_success", { ns: "gallery" }) 
          : t("image_uploaded_success", { ns: "gallery" }),
      });
      
      await onFeedbackSubmit();
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: t("error", { ns: "common" }),
        description: t("upload_error", { ns: "gallery" }),
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      event.target.value = ''; // Reset file input
    }
  };
  
  return (
    <Card
      className={`overflow-hidden transition-all duration-200 hover:shadow-md 
      ${selected ? 'ring-2 ring-primary' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Media Preview with aspect ratio container */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            paddingBottom: `${(size.height / size.width) * 100}%`,
            position: "relative",
            overflow: "hidden",
            backgroundColor: "#f3f4f6" // Light gray background for empty states
          }}
          className="relative"
        >
          {selectable && (
            <div className={`absolute top-2 left-2 z-10 transition-opacity ${isHovered || selected ? 'opacity-100' : 'opacity-0'}`}>
              <Checkbox
                checked={selected}
                onCheckedChange={(checked) => {
                  if (onSelect) {
                    onSelect(id, !!checked);
                  }
                }}
                className="h-5 w-5 bg-white/90 backdrop-blur-sm rounded-sm border-gray-300"
              />
            </div>
          )}
          
          <div className="absolute top-2 right-2 z-10">
            <AdQuickActions 
              adId={id} 
              onUpdate={onFeedbackSubmit} 
              projectId={projectId}
              mediaType={media_type}
              imageUrl={imageUrl || storage_url}
            />
          </div>

          {/* Upload media button (visible on hover) */}
          <div className={`absolute top-12 right-2 z-10 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <label htmlFor={`upload-media-${id}`} className="cursor-pointer">
              <div className="bg-white/90 backdrop-blur-sm p-1.5 rounded-full hover:bg-white">
                <Upload className="h-4 w-4 text-gray-700" />
                <input
                  type="file"
                  id={`upload-media-${id}`}
                  className="hidden"
                  accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
                  onChange={handleUploadMedia}
                  disabled={isUploading}
                />
              </div>
            </label>
          </div>
          
          {/* Format selector button (visible on hover) */}
          <div className={`absolute top-24 right-2 z-10 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white"
              onClick={() => setIsFormatDialogOpen(true)}
            >
              <span className="sr-only">Change Format</span>
              <Image className="h-4 w-4 text-gray-700" />
            </Button>
          </div>
          
          {/* Edit button (visible on hover) */}
          <div className={`absolute top-36 right-2 z-10 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 bg-white/90 backdrop-blur-sm rounded-full hover:bg-white"
              onClick={() => window.location.href = `/gallery/edit/${id}`}
            >
              <span className="sr-only">Edit</span>
              <Edit className="h-4 w-4 text-gray-700" />
            </Button>
          </div>

          {/* Platform/format badge */}
          <Badge
            variant="outline"
            className="absolute bottom-2 right-2 z-10 bg-white/80 backdrop-blur-sm text-xs"
          >
            {platform} / {size.label}
          </Badge>
          
          {/* Media type badge */}
          <Badge
            variant="outline"
            className="absolute bottom-2 left-2 z-10 bg-white/80 backdrop-blur-sm text-xs flex items-center"
          >
            {media_type === 'video' ? (
              <>
                <Video className="h-3 w-3 mr-1" />
                Video
              </>
            ) : (
              'Image'
            )}
          </Badge>
          
          {/* Actual media preview */}
          <div className="absolute inset-0">
            <MediaPreview
              imageUrl={imageUrl || storage_url || null}
              isVideo={media_type === 'video'}
              format={size}
              status={image_status}
              onRetry={handleProcessImage}
            />
          </div>
        </div>
      </div>

      {/* Card content */}
      <CardContent className="p-3 md:p-4 space-y-2">
        <div className="flex justify-between items-start">
          <h3 className="font-medium text-sm md:text-base line-clamp-1">
            {headline || t("untitled_ad")}
          </h3>
          
          {/* Project label if assigned */}
          {projectId && (
            <Badge variant="secondary" className="text-xs ml-2 whitespace-nowrap">
              Project
            </Badge>
          )}
        </div>
        
        {primaryText && (
          <div>
            <p 
              className={`text-xs text-gray-500 ${showFullText ? '' : 'line-clamp-2'}`}
              onClick={() => setShowFullText(!showFullText)}
            >
              {primaryText}
            </p>
            {primaryText.length > 120 && (
              <Button 
                variant="link" 
                size="sm" 
                className="text-xs p-0 h-auto mt-1"
                onClick={() => setShowFullText(!showFullText)}
              >
                {showFullText ? t("show_less") : t("show_more")}
              </Button>
            )}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="p-3 pt-0 md:p-4 md:pt-0 flex justify-between text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 mr-0.5 text-amber-400 fill-amber-400" />
          <span>4.5</span>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-7 px-2 -mr-2">
            <MessageSquare className="h-3.5 w-3.5 mr-1" />
            <span>3</span>
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 -mr-2">
            <Heart className="h-3.5 w-3.5 mr-1" />
            <span>12</span>
          </Button>
        </div>
      </CardFooter>
      
      {/* Format selection dialog */}
      <Dialog open={isFormatDialogOpen} onOpenChange={setIsFormatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("select_ad_format", { ns: "gallery" })}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <AdSizeSelector 
              selectedFormat={selectedFormat} 
              onFormatChange={handleFormatChange}
            />
            <div className="mt-6 flex justify-end">
              <Button 
                variant="default" 
                onClick={() => {
                  setIsFormatDialogOpen(false);
                  // Here you would save the format to the database
                  // For now, we just close the dialog
                }}
              >
                {t("apply", { ns: "common" })}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
