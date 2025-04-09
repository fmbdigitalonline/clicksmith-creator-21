import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  Facebook,
  ImagePlus,
  Loader2,
  Pencil,
  Wand2,
} from "lucide-react";
import { uploadMedia, updateAdImage } from "@/utils/uploadUtils";
import { AdSize, FacebookAdSettings } from "@/types/campaignTypes";
import MediaPreview from "@/components/steps/gallery/components/MediaPreview";
import { AdFeedbackControls } from "@/components/steps/gallery/components/AdFeedbackControls";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { useTranslation } from "react-i18next";

interface SavedAdCardProps {
  id: string;
  primaryText?: string;
  headline?: string;
  imageUrl?: string;
  storage_url?: string;
  image_status?: 'pending' | 'processing' | 'ready' | 'failed';
  onFeedbackSubmit?: () => void;
  platform?: string;
  size?: AdSize;
  selected?: boolean;
  selectable?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  projectId?: string;
  fb_ad_settings?: FacebookAdSettings;
  projectUrl?: string;
  onSettingsSaved?: (settings: FacebookAdSettings, adId: string, applyToAll?: boolean) => void;
}

const fileUploadSchema = z.object({
  file: z.any(),
});

function FileUploader({ onFileSelected, isUploading }: { onFileSelected: (file: File) => Promise<void>, isUploading: boolean }) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof fileUploadSchema>>({
    resolver: zodResolver(fileUploadSchema),
    defaultValues: {
      file: null,
    },
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      toast({
        title: "Error",
        description: "No file selected",
        variant: "destructive",
      });
      return;
    }

    try {
      await onFileSelected(file);
    } catch (error) {
      console.error("Error uploading file:", error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
    }
  };

  return (
    <Form {...form}>
      <form className="space-y-4">
        <FormField
          control={form.control}
          name="file"
          render={() => (
            <FormItem>
              <FormLabel>Upload New Image</FormLabel>
              <FormControl>
                <div className="flex items-center space-x-2">
                  <Input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="hidden"
                  />
                  <Label htmlFor="image-upload" className="cursor-pointer bg-secondary hover:bg-secondary-foreground text-secondary-foreground font-semibold py-2 px-4 rounded-md">
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      "Select Image"
                    )}
                  </Label>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}

export function SavedAdCard({ 
  id, 
  primaryText, 
  headline, 
  imageUrl,
  storage_url,
  image_status,
  onFeedbackSubmit, 
  platform,
  size,
  selected = false,
  selectable = false,
  onSelect,
  projectId,
  fb_ad_settings,
  projectUrl,
  onSettingsSaved
}: SavedAdCardProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl || storage_url || '');
  const [isRegenerateDialogOpen, setIsRegenerateDialogOpen] = useState(false);
  const [regeneratePrompt, setRegeneratePrompt] = useState("Professional marketing image for advertisement");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation(["gallery", "common", "integrations"]);

  const handleFileUpload = async (file: File) => {
    try {
      setIsUploading(true);
      // Upload the file
      const newImageUrl = await uploadMedia(file);
      
      // Update the ad record with the new image URL
      await updateAdImage(id, newImageUrl);
      
      // Update the local state
      setCurrentImageUrl(newImageUrl);
      
      toast({
        title: "Upload successful",
        description: "Your new image has been uploaded and saved.",
      });
      
      // Call the feedback submit function to refresh the parent
      if (onFeedbackSubmit) {
        onFeedbackSubmit();
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setIsRegenerateDialogOpen(false);
    }
  };

  const handleImageActionClick = () => {
    setIsRegenerateDialogOpen(true);
  };

  const handleSubmitRegeneration = async () => {
    setIsRegenerating(true);
    try {
      // Simulate AI image generation (replace with actual AI call)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For now, just update the image URL with a placeholder
      const newImageUrl = "https://placekitten.com/500/300";
      
      // Update the ad record with the new image URL
      await updateAdImage(id, newImageUrl);
      
      // Update the local state
      setCurrentImageUrl(newImageUrl);
      
      toast({
        title: "Image regenerated",
        description: "Your new image has been generated.",
      });
      
      // Call the feedback submit function to refresh the parent
      if (onFeedbackSubmit) {
        onFeedbackSubmit();
      }
    } catch (error) {
      console.error('Error in regeneration:', error);
      toast({
        title: "Regeneration failed",
        description: "Could not regenerate the image. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
      setIsRegenerateDialogOpen(false);
    }
  };

  const handleSelectToggle = () => {
    if (selectable && onSelect) {
      onSelect(id, !selected);
    }
  };

  // Make sure we update the local state when props change
  useEffect(() => {
    if (imageUrl) {
      setCurrentImageUrl(imageUrl);
    } else if (storage_url) {
      setCurrentImageUrl(storage_url);
    }
  }, [imageUrl, storage_url]);

  return (
    <Card className={`overflow-hidden ${selected ? 'ring-2 ring-primary' : ''}`}>
      {selectable && (
        <div 
          className="absolute top-2 left-2 z-10 bg-white bg-opacity-80 rounded-md p-1 cursor-pointer shadow-sm hover:bg-opacity-100 transition-all" 
          onClick={handleSelectToggle}
        >
          {selected ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-primary"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-muted-foreground"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
            </svg>
          )}
        </div>
      )}
      
      <div className="relative">
        <div style={{ 
          aspectRatio: size ? `${size.width} / ${size.height}` : "1.91 / 1",
          maxHeight: '300px'
        }} className="relative rounded-t-md overflow-hidden">
          <MediaPreview
            imageUrl={currentImageUrl || ''}
            isVideo={false}
            format={size || { width: 1200, height: 628, label: "Default" }}
            status={image_status}
          />
          
          <div className="absolute bottom-2 right-2 flex gap-1">
            <Button
              variant="secondary"
              size="icon"
              className="bg-white/90 hover:bg-white shadow-md"
              onClick={handleImageActionClick}
              title="Replace image"
            >
              <Wand2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-600">
              {t("primary_text")}
            </h3>
            <p className="text-gray-800">{primaryText}</p>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between p-4">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">{headline}</h4>
            <p className="text-xs text-gray-500">
              {platform} Ad
            </p>
          </div>
          <Button variant="outline" size="icon" onClick={() => setIsSettingsOpen(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
        </CardFooter>
      </div>

      <Dialog open={isRegenerateDialogOpen} onOpenChange={setIsRegenerateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Replace Image</DialogTitle>
            <DialogDescription>
              Choose how you want to replace the image
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="upload">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload">Upload Image</TabsTrigger>
              <TabsTrigger value="ai">AI Generate</TabsTrigger>
            </TabsList>
            
            <TabsContent value="upload" className="pt-4">
              <FileUploader 
                onFileSelected={handleFileUpload}
                isUploading={isUploading} 
              />
            </TabsContent>
            
            <TabsContent value="ai" className="pt-4">
              <div className="space-y-4">
                <Textarea
                  placeholder="Describe what you'd like to see in this image..."
                  value={regeneratePrompt}
                  onChange={(e) => setRegeneratePrompt(e.target.value)}
                  className="min-h-[120px]"
                />
                
                <Button 
                  onClick={handleSubmitRegeneration}
                  disabled={isRegenerating} 
                  className="w-full"
                >
                  {isRegenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="mr-2 h-4 w-4" />
                      Generate New Image
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {isSettingsOpen && (
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Facebook Ad Settings</DialogTitle>
              <DialogDescription>
                Configure the settings for your Facebook ad
              </DialogDescription>
            </DialogHeader>
            <AdFeedbackControls
              adId={id}
              projectId={projectId}
            />
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
}
