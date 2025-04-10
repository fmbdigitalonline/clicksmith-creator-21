import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AdFeedbackControls } from "@/components/steps/gallery/components/AdFeedbackControls";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Check, X, Download, Save, CheckSquare, Square, Image, AlertCircle, Loader2, Facebook, Globe, Copy, ChevronUp, ChevronDown, RefreshCw, Wand2, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AdSizeSelector, AD_FORMATS } from "@/components/steps/gallery/components/AdSizeSelector";
import DownloadControls from "@/components/steps/gallery/components/DownloadControls";
import { convertImage } from "@/utils/imageUtils";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { uploadMedia, MediaUploadResult } from "@/utils/uploadUtils";
import { FacebookAdSettings } from "@/types/campaignTypes";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import FacebookAdSettingsForm from "@/components/integrations/FacebookAdSettings";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface SavedAdCardProps {
  id: string;
  primaryText?: string;
  headline?: string;
  imageUrl?: string;
  storage_url?: string;
  image_status?: string;
  onFeedbackSubmit: () => void;
  platform?: string;
  size?: {
    width: number;
    height: number;
    label: string;
  };
  projectId?: string;
  selected?: boolean;
  onSelect?: (id: string, isSelected: boolean) => void;
  selectable?: boolean;
  fb_ad_settings?: FacebookAdSettings;
  projectUrl?: string;
  onSettingsSaved?: (settings: FacebookAdSettings, adId: string, applyToAll?: boolean) => void;
  onRegenerateImage?: (adId: string, prompt?: string) => void;
}

export const SavedAdCard = ({ 
  id, 
  primaryText, 
  headline, 
  imageUrl,
  storage_url,
  image_status = "pending",
  onFeedbackSubmit,
  platform = "facebook",
  size = AD_FORMATS[0],
  projectId,
  selected = false,
  onSelect,
  selectable = false,
  fb_ad_settings,
  projectUrl,
  onSettingsSaved,
  onRegenerateImage
}: SavedAdCardProps) => {
  const [isEditingText, setIsEditingText] = useState(false);
  const [editedHeadline, setEditedHeadline] = useState(headline || "");
  const [editedDescription, setEditedDescription] = useState(primaryText || "");
  const [selectedFormat, setSelectedFormat] = useState(size);
  const [downloadFormat, setDownloadFormat] = useState<"jpg" | "png" | "pdf" | "docx">("jpg");
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentImageStatus, setCurrentImageStatus] = useState(image_status);
  const [displayUrl, setDisplayUrl] = useState(storage_url || imageUrl);
  const [isHovered, setIsHovered] = useState(false);
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [regeneratePrompt, setRegeneratePrompt] = useState(primaryText || "Professional marketing image for advertisement");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setDisplayUrl(storage_url || imageUrl);
  }, [storage_url, imageUrl]);

  useEffect(() => {
    if (currentImageStatus === 'ready' || !id) {
      return;
    }

    const checkImageStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('ad_feedback')
          .select('image_status, storage_url')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        if (data) {
          setCurrentImageStatus(data.image_status || 'pending');
          if (data.storage_url) {
            setDisplayUrl(data.storage_url);
          }
        }
      } catch (error) {
        console.error("Error checking image status:", error);
      }
    };

    checkImageStatus();
    
    const interval = setInterval(() => {
      if (currentImageStatus !== 'ready') {
        checkImageStatus();
      } else {
        clearInterval(interval);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [id, currentImageStatus]);

  const handleSaveTextEdits = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('ad_feedback')
        .update({
          primary_text: editedDescription,
          headline: editedHeadline
        })
        .eq('id', id);

      if (error) throw error;

      setIsEditingText(false);
      onFeedbackSubmit();
      
      toast({
        title: "Changes saved",
        description: "Your ad text has been updated.",
      });
    } catch (error) {
      console.error('Error saving text edits:', error);
      toast({
        title: "Error",
        description: "Failed to save text edits. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelTextEdits = () => {
    setIsEditingText(false);
    setEditedHeadline(headline || "");
    setEditedDescription(primaryText || "");
  };

  const handleFormatChange = (format: typeof AD_FORMATS[0]) => {
    setSelectedFormat(format);
    toast({
      title: "Format updated",
      description: `Ad format changed to ${format.label}`,
    });
  };

  const handleDownload = async () => {
    if (!displayUrl) {
      toast({
        title: "Error",
        description: "No image URL available for download",
        variant: "destructive",
      });
      return;
    }

    try {
      const blob = await convertImage(displayUrl, downloadFormat, { 
        platform,
        size: selectedFormat, 
        headline: editedHeadline, 
        description: editedDescription 
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${platform}-ad-${selectedFormat.width}x${selectedFormat.height}.${downloadFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success!",
        description: `Your ${selectedFormat.label} ad has been downloaded as ${downloadFormat.toUpperCase()}.`,
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

  const handleUpdateSizeInDb = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('ad_feedback')
        .update({
          size: selectedFormat
        })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: "Format updated",
        description: `The ad format has been saved as ${selectedFormat.label}.`,
      });
      onFeedbackSubmit();
    } catch (error) {
      console.error('Error updating format:', error);
      toast({
        title: "Error",
        description: "Failed to update format. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectChange = (checked: boolean) => {
    if (onSelect) {
      onSelect(id, checked);
    }
  };

  const handleProcessImage = async () => {
    if (!imageUrl || currentImageStatus === 'ready') {
      return;
    }

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke('migrate-images', {
        body: { adId: id }
      });

      if (error) throw error;

      toast({
        title: "Image processing",
        description: "Your image is being processed for Facebook ads. This may take a moment.",
      });

      if (data.processed && data.processed.length > 0) {
        const result = data.processed[0];
        if (result.success) {
          setCurrentImageStatus('processing');
          if (result.storage_url) {
            setDisplayUrl(result.storage_url);
          }
        } else {
          throw new Error(result.error || "Failed to process image");
        }
      }
    } catch (error) {
      console.error('Error processing image:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegenerateImage = () => {
    setIsRegenerateDialogOpen(true);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }

    const file = event.target.files[0];
    setIsUploading(true);

    try {
      const mediaData = await uploadMedia(file);
      
      const { error } = await supabase
        .from('ad_feedback')
        .update({
          imageurl: mediaData.url,
          storage_url: mediaData.url,
          image_status: platform === 'facebook' ? 'pending' : 'ready',
          media_type: mediaData.isVideo ? 'video' : 'image',
          file_type: mediaData.fileType
        })
        .eq('id', id);

      if (error) throw error;

      setDisplayUrl(mediaData.url);
      
      if (platform === 'facebook') {
        setCurrentImageStatus('pending');
        try {
          await handleProcessImage();
        } catch (processError) {
          console.error('Error processing uploaded image:', processError);
        }
      } else {
        setCurrentImageStatus('ready');
      }

      toast({
        title: "Image uploaded successfully",
        description: "Your new image has been uploaded and is ready to use.",
      });
      
      setIsUploadDialogOpen(false);
      
      if (onFeedbackSubmit) {
        onFeedbackSubmit();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "Could not upload the image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmitRegeneration = async () => {
    if (!onRegenerateImage) {
      setIsUploadDialogOpen(true);
      setIsRegenerateDialogOpen(false);
      return;
    }
    
    setIsRegenerating(true);
    setIsRegenerateDialogOpen(false);
    
    try {
      await onRegenerateImage(id, regeneratePrompt);
      toast({
        title: "Regeneration started",
        description: "Your new image is being generated. This may take a moment.",
      });
    } catch (error) {
      console.error('Error submitting regeneration:', error);
      toast({
        title: "Regeneration failed",
        description: "Could not start image regeneration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const renderImageStatus = () => {
    switch (currentImageStatus) {
      case 'ready':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
            <Check className="h-3 w-3 mr-1" /> Ready for Facebook
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Processing
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
            <AlertCircle className="h-3 w-3 mr-1" /> Processing Failed
          </Badge>
        );
      default:
        return (
          <Button 
            variant="outline" 
            size="sm" 
            className="text-xs flex items-center gap-1"
            onClick={handleProcessImage}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Image className="h-3 w-3" />
            )}
            Process for Facebook
          </Button>
        );
    }
  };

  const [isAdSettingsOpen, setIsAdSettingsOpen] = useState(false);
  
  const handleAdSettingsSaved = (settings: FacebookAdSettings, adId: string, applyToAll: boolean = false) => {
    if (onSettingsSaved) {
      onSettingsSaved(settings, adId, applyToAll);
    }
    toast({
      title: "Facebook Ad Settings Saved",
      description: applyToAll 
        ? "Your settings have been applied to all selected ads" 
        : "Your Facebook ad settings have been saved for this ad"
    });
  };

  return (
    <Card 
      className={`overflow-hidden relative ${selected ? 'ring-2 ring-primary border-primary' : ''}`}
    >
      {selectable && (
        <div className="absolute top-3 left-3 z-10 bg-white/90 p-1.5 rounded-md shadow-sm border border-gray-200">
          <Checkbox 
            checked={selected} 
            onCheckedChange={handleSelectChange}
            className="h-5 w-5"
            id={`select-ad-${id}`}
          />
        </div>
      )}

      {projectId && (
        <div className="absolute top-3 right-3 z-10 bg-primary/90 text-white text-xs px-2 py-1 rounded-md">
          Project
        </div>
      )}

      <div className="p-4 space-y-4">
        <div className="flex justify-between mb-2 items-center">
          <div className="flex-shrink-0">
            {renderImageStatus()}
          </div>
          <div className="flex items-center gap-2">
            <AdSizeSelector
              selectedFormat={selectedFormat}
              onFormatChange={handleFormatChange}
            />
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-2" 
              onClick={handleUpdateSizeInDb}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-1" /> Save
            </Button>
          </div>
        </div>

        {platform === "facebook" && (
          <Collapsible 
            open={isAdSettingsOpen} 
            onOpenChange={setIsAdSettingsOpen}
            className="border rounded-lg bg-blue-50/30 mb-4"
          >
            <div className="flex items-center justify-between p-3 border-b">
              <div className="flex items-center">
                <Facebook className="h-4 w-4 mr-2 text-facebook" />
                <h3 className="text-sm font-medium">Facebook Ad Settings</h3>
                {fb_ad_settings?.website_url && !isAdSettingsOpen && (
                  <Badge variant="outline" className="ml-2 text-xs bg-blue-50 border-blue-200">
                    <Globe className="h-3 w-3 mr-1" /> 
                    {fb_ad_settings.website_url}
                  </Badge>
                )}
              </div>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  {isAdSettingsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="p-3">
              <FacebookAdSettingsForm 
                adIds={[id]} 
                projectUrl={projectUrl}
                initialSettings={fb_ad_settings}
                onSettingsSaved={handleAdSettingsSaved}
                showApplyToAllOption={selectable && selected}
              />
            </CollapsibleContent>
          </Collapsible>
        )}

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
                  disabled={isSaving}
                >
                  <Check className="h-4 w-4 mr-1" /> Save
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-gray-800 whitespace-pre-wrap">{editedDescription}</p>
          )}
        </div>
      
        {displayUrl && (
          <div 
            className="relative rounded-lg overflow-hidden"
            style={{ 
              aspectRatio: `${selectedFormat.width} / ${selectedFormat.height}`,
              maxHeight: '600px'
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <img
              src={displayUrl}
              alt="Ad creative"
              className="object-cover w-full h-full"
            />
            {currentImageStatus === 'processing' && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="bg-white p-2 rounded-full">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              </div>
            )}
            
            {isHovered && (
              <Button 
                variant="secondary"
                size="icon"
                className="absolute bottom-3 right-3 bg-white/90 hover:bg-white shadow-md"
                onClick={handleRegenerateImage}
                title="Replace image"
                disabled={isRegenerating || isUploading}
              >
                {isRegenerating || isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        )}

        {currentImageStatus === 'failed' && (
          <Alert variant="destructive" className="my-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Processing Failed</AlertTitle>
            <AlertDescription>
              We couldn't process this image for Facebook ads. Try uploading a different image.
            </AlertDescription>
          </Alert>
        )}

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
            <h3 className="text-lg font-semibold text-facebook">{editedHeadline}</h3>
          )}
        </div>

        <div className="mt-4">
          <DownloadControls
            downloadFormat={downloadFormat}
            onFormatChange={(value) => setDownloadFormat(value as "jpg" | "png" | "pdf" | "docx")}
            onSave={handleSaveTextEdits}
            onDownload={handleDownload}
            isSaving={isSaving}
          />
        </div>

        <CardContent className="p-4 bg-gray-50 rounded-md mt-4">
          <AdFeedbackControls
            adId={id}
            onFeedbackSubmit={onFeedbackSubmit}
          />
        </CardContent>
      </div>

      <Dialog open={isRegenerateDialogOpen} onOpenChange={setIsRegenerateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Update Ad Image</DialogTitle>
            <DialogDescription>
              Choose how you'd like to update this ad image
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            {onRegenerateImage && (
              <>
                <h3 className="text-sm font-medium">Option 1: Generate with AI</h3>
                <Textarea
                  placeholder="Describe what you'd like to see in this image..."
                  className="min-h-[120px]"
                  value={regeneratePrompt}
                  onChange={(e) => setRegeneratePrompt(e.target.value)}
                />
              </>
            )}
            
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">Option 2: Upload Your Own Image</h3>
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center"
                onClick={() => {
                  setIsRegenerateDialogOpen(false);
                  setIsUploadDialogOpen(true);
                }}
              >
                <Upload className="mr-2 h-4 w-4" />
                Select Image File
              </Button>
            </div>
          </div>
          
          <DialogFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setIsRegenerateDialogOpen(false)}>
              Cancel
            </Button>
            {onRegenerateImage && (
              <Button onClick={handleSubmitRegeneration} disabled={isRegenerating}>
                {isRegenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate with AI
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Upload Custom Image</DialogTitle>
            <DialogDescription>
              Select an image file from your computer to use for this ad
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="image-upload">Image</Label>
              <Input
                ref={fileInputRef}
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </div>
            
            <div className="mt-4 text-sm text-muted-foreground">
              <p>Recommended image dimensions: {selectedFormat.width}x{selectedFormat.height}px</p>
              <p>Supported formats: JPG, PNG, WebP</p>
              <p>Maximum file size: 5MB</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)} disabled={isUploading}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
