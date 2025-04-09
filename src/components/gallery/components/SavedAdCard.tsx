
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Star, ThumbsUp, ThumbsDown, Download, Share2, Edit, Loader2, Trash2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdFeedbackControls } from "@/components/steps/gallery/components/AdFeedbackControls";
import { supabase } from "@/integrations/supabase/client";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { uploadMedia, updateAdImage } from "@/utils/uploadUtils";

interface SavedAdCardProps {
  id: string;
  headline?: string;
  primaryText?: string;
  imageUrl?: string;
  storage_url?: string;
  image_status?: 'pending' | 'processing' | 'ready' | 'failed';
  platform?: string;
  size?: {
    width: number;
    height: number;
    label: string;
  };
  projectId?: string;
  onFeedbackSubmit?: () => void;
  onRegenerateImage?: (adId: string, prompt?: string) => Promise<void>;
  media_type?: 'image' | 'video';
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (adId: string, isSelected: boolean) => void;
  fb_ad_settings?: any;
}

export function SavedAdCard({
  id,
  headline,
  primaryText,
  imageUrl,
  storage_url,
  image_status: initialImageStatus,
  platform,
  size,
  projectId,
  onFeedbackSubmit,
  onRegenerateImage,
  media_type: initialMediaType = 'image',
  selectable = false,
  selected = false,
  onSelect,
  fb_ad_settings
}: SavedAdCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentImageStatus, setCurrentImageStatus] = useState<'pending' | 'processing' | 'ready' | 'failed'>(initialImageStatus || 'ready');
  const [displayUrl, setDisplayUrl] = useState<string | undefined>(storage_url || imageUrl);
  const [mediaType, setMediaType] = useState<'image' | 'video'>(initialMediaType);
  const { toast } = useToast();

  useEffect(() => {
    setDisplayUrl(storage_url || imageUrl);
  }, [storage_url, imageUrl]);

  useEffect(() => {
    if (currentImageStatus === 'ready' || !id) {
      return;
    }

    let isSubscribed = true;
    
    const checkImageStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('ad_feedback')
          .select('image_status, storage_url, media_type')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        if (data && isSubscribed) {
          // Check if data has the properties before accessing them
          if ('image_status' in data) {
            setCurrentImageStatus(data.image_status as 'pending' | 'processing' | 'ready' | 'failed');
          }
          
          if ('storage_url' in data && data.storage_url) {
            setDisplayUrl(data.storage_url);
          }
          
          if ('media_type' in data && data.media_type) {
            setMediaType(data.media_type as 'image' | 'video');
          }
          
          // If the image is ready, no need to check again
          if (data.image_status === 'ready') {
            return;
          }
          
          // If the image failed, show an error toast
          if (data.image_status === 'failed') {
            toast({
              title: "Image Processing Failed",
              description: "The image could not be processed. Please try uploading a different image.",
              variant: "destructive",
            });
            return;
          }
        }
        
        // Check again in 3 seconds if still processing
        setTimeout(checkImageStatus, 3000);
      } catch (error) {
        console.error('Error checking image status:', error);
        if (isSubscribed) {
          setTimeout(checkImageStatus, 5000);
        }
      }
    };
    
    checkImageStatus();
    
    return () => {
      isSubscribed = false;
    };
  }, [id, currentImageStatus, toast]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('ad_feedback')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Ad deleted",
        description: "The ad has been removed from your gallery",
      });
      
      if (onFeedbackSubmit) {
        onFeedbackSubmit();
      }
    } catch (error) {
      console.error('Error deleting ad:', error);
      toast({
        title: "Error",
        description: "Failed to delete the ad. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setUploadFile(file);
      
      // Determine if it's a video
      const isVideo = file.type.startsWith('video/');
      setMediaType(isVideo ? 'video' : 'image');
    }
  };

  const handleUpload = async () => {
    if (!uploadFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      const isVideo = uploadFile.type.startsWith('video/');
      const result = await uploadMedia(uploadFile);
      const imageUrl = result.url;

      const { error } = await supabase
        .from('ad_feedback')
        .update({
          imageurl: imageUrl,
          storage_url: imageUrl,
          media_type: isVideo ? 'video' : 'image',
          image_status: platform === 'facebook' ? 'pending' : 'ready'
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: `${isVideo ? 'Video' : 'Image'} uploaded successfully`,
        description: `Your ${isVideo ? 'video' : 'image'} has been uploaded and set as the new ad media.`
      });
      
      setDisplayUrl(imageUrl);
      setCurrentImageStatus(platform === 'facebook' ? 'pending' : 'ready');
      
      if (onFeedbackSubmit) {
        onFeedbackSubmit();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setIsUploadDialogOpen(false);
    }
  };

  const renderMedia = () => {
    if (!displayUrl) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <p className="text-gray-500">No media</p>
        </div>
      );
    }

    return mediaType === 'video' ? (
      <video 
        src={displayUrl} 
        controls 
        className="w-full h-full object-cover"
        style={{ aspectRatio: size ? `${size.width} / ${size.height}` : '16/9' }}
      />
    ) : (
      <img
        src={displayUrl}
        alt={headline || "Ad"}
        className="w-full h-full object-cover"
        style={{ aspectRatio: size ? `${size.width} / ${size.height}` : '16/9' }}
      />
    );
  };

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        <div className="relative" style={{ aspectRatio: size ? `${size.width} / ${size.height}` : '16/9' }}>
          {currentImageStatus === 'pending' || currentImageStatus === 'processing' ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-20">
              <div className="flex flex-col items-center">
                <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
                <p className="text-sm text-gray-500 mt-2">
                  {currentImageStatus === 'pending' 
                    ? 'Preparing media...' 
                    : 'Processing for ad platforms...'}
                </p>
              </div>
            </div>
          ) : null}
          
          <div className={`${(currentImageStatus === 'pending' || currentImageStatus === 'processing') ? 'opacity-30' : ''}`}>
            {renderMedia()}
          </div>
        </div>
        
        <div className="absolute top-2 right-2 flex space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="bg-white/90 hover:bg-white"
                  onClick={() => setIsUploadDialogOpen(true)}
                >
                  <Upload size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Upload new media</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="bg-white/90 hover:bg-white"
                  onClick={() => setIsDeleteDialogOpen(true)}
                >
                  <Trash2 size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete ad</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold line-clamp-2 mb-2">{headline || "Untitled Ad"}</h3>
        <p className="text-sm text-gray-600 line-clamp-3 mb-4">{primaryText || "No description"}</p>
        <AdFeedbackControls 
          adId={id} 
          projectId={projectId} 
          onFeedbackSubmit={onFeedbackSubmit}
        />
      </CardContent>
      
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Ad</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this ad? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Media</DialogTitle>
            <DialogDescription>
              Upload a new image or video for this ad. Supported formats: JPG, PNG, WebP, GIF, MP4, MOV, WebM.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="picture">Picture or Video</Label>
              <Input
                id="picture"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/x-msvideo,video/webm"
                onChange={handleFileChange}
              />
              <p className="text-xs text-gray-500">
                Max size: 5MB for images, 10MB for videos
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpload} disabled={isUploading || !uploadFile}>
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Upload'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
