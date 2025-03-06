
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AdFeedbackControls } from "@/components/steps/gallery/components/AdFeedbackControls";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X, Download, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AdSizeSelector, AD_FORMATS } from "@/components/steps/gallery/components/AdSizeSelector";
import DownloadControls from "@/components/steps/gallery/components/DownloadControls";
import { convertImage } from "@/utils/imageUtils";

interface SavedAdCardProps {
  id: string;
  primaryText?: string;
  headline?: string;
  imageUrl?: string;
  onFeedbackSubmit: () => void;
  platform?: string;
  size?: {
    width: number;
    height: number;
    label: string;
  };
}

export const SavedAdCard = ({ 
  id, 
  primaryText, 
  headline, 
  imageUrl,
  onFeedbackSubmit,
  platform = "facebook",
  size = AD_FORMATS[0]
}: SavedAdCardProps) => {
  const [isEditingText, setIsEditingText] = useState(false);
  const [editedHeadline, setEditedHeadline] = useState(headline || "");
  const [editedDescription, setEditedDescription] = useState(primaryText || "");
  const [selectedFormat, setSelectedFormat] = useState(size);
  const [downloadFormat, setDownloadFormat] = useState<"jpg" | "png" | "pdf" | "docx">("jpg");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

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
    if (!imageUrl) {
      toast({
        title: "Error",
        description: "No image URL available for download",
        variant: "destructive",
      });
      return;
    }

    try {
      const blob = await convertImage(imageUrl, downloadFormat, { 
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

  return (
    <Card className="overflow-hidden">
      {/* Format Selector */}
      <div className="p-4 space-y-4">
        <div className="flex justify-end mb-2">
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
        {imageUrl && (
          <div 
            style={{ 
              aspectRatio: `${selectedFormat.width} / ${selectedFormat.height}`,
              maxHeight: '600px'
            }} 
            className="relative rounded-lg overflow-hidden"
          >
            <img
              src={imageUrl}
              alt="Ad creative"
              className="object-cover w-full h-full"
            />
          </div>
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
