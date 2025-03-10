import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { AdFeedbackControls } from "@/components/steps/gallery/components/AdFeedbackControls";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X, Download, Save, CheckSquare, Square, Image, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AdSizeSelector, AD_FORMATS } from "@/components/steps/gallery/components/AdSizeSelector";
import DownloadControls from "@/components/steps/gallery/components/DownloadControls";
import { convertImage } from "@/utils/imageUtils";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { uploadMedia } from "@/utils/uploadUtils";
import { CardContent } from "@/components/ui/card";

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
}: SavedAdCardProps) => {
  const [isEditingText, setIsEditingText] = useState(false);
  const [editedHeadline, setEditedHeadline] = useState(headline || "");
  const [editedDescription, setEditedDescription] = useState(primaryText || "");
  const [selectedFormat, setSelectedFormat] = useState(size);
  const [downloadFormat, setDownloadFormat] = useState<"jpg" | "png" | "pdf" | "docx">("jpg");
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentImageStatus, setCurrentImageStatus] = useState(image_status);
  const [displayUrl, setDisplayUrl] = useState(storage_url || imageUrl);
  const { toast } = useToast();

  // Effect to check and update image status periodically if not ready
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

    // Check status immediately
    checkImageStatus();
    
    // Check status every 5 seconds if not ready
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
    } finally {
      setIsSaving(false);
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

  return (
    <Card className={`overflow-hidden relative ${selected ? 'ring-2 ring-primary border-primary' : ''}`}>
      {/* Selection Checkbox - Made more visible with improved styling */}
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

      {/* Project Label */}
      {projectId && (
        <div className="absolute top-3 right-3 z-10 bg-primary/90 text-white text-xs px-2 py-1 rounded-md">
          Project
        </div>
      )}

      {/* Format Selector */}
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
      
        {/* Image Section */}
        {displayUrl && (
          <div 
            style={{ 
              aspectRatio: `${selectedFormat.width} / ${selectedFormat.height}`,
              maxHeight: '600px'
            }} 
            className="relative rounded-lg overflow-hidden"
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
            <h3 className="text-lg font-semibold text-facebook">{editedHeadline}</h3>
          )}
        </div>

        {/* Download Controls */}
        <div className="mt-4">
          <DownloadControls
            downloadFormat={downloadFormat}
            onFormatChange={(value) => setDownloadFormat(value as "jpg" | "png" | "pdf" | "docx")}
            onSave={handleSaveTextEdits}
            onDownload={handleDownload}
            isSaving={isSaving}
          />
        </div>

        {/* Feedback Controls */}
        <CardContent className="p-4 bg-gray-50 rounded-md mt-4">
          <AdFeedbackControls
            adId={id}
            onFeedbackSubmit={onFeedbackSubmit}
          />
        </CardContent>
      </div>
    </Card>
  );
};
