import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileEdit,
  Trash2,
  Star,
  Download,
  X,
  Check,
  Image,
  Copy,
  RotateCcw,
  Upload,
  FileVideo
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface SavedAdCardProps {
  id: string;
  primaryText?: string;
  headline?: string;
  imageUrl?: string;
  storage_url?: string;
  image_status?: 'pending' | 'processing' | 'ready' | 'failed';
  onFeedbackSubmit?: () => void;
  onRegenerateImage?: (prompt?: string) => void;
  platform?: string;
  size?: {
    width: number;
    height: number;
    label: string;
  };
  projectId?: string;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  selectable?: boolean;
  fb_ad_settings?: FacebookAdSettings;
  projectUrl?: string;
  onSettingsSaved?: (settings: FacebookAdSettings, adId: string, applyToAll?: boolean) => Promise<void>;
}

const formSchema = z.object({
  website_url: z.string().url({ message: "Please enter a valid URL." }),
  visible_link: z.string().min(2, {
    message: "Visible link must be at least 2 characters.",
  }),
  call_to_action: z.string().min(2, {
    message: "Call to action must be selected.",
  }),
  ad_language: z.string().min(2, {
    message: "Ad language must be selected.",
  }),
  url_parameters: z.string().optional(),
  browser_addon: z.string().optional(),
})

export const SavedAdCard = ({
  id,
  primaryText,
  headline,
  imageUrl,
  storage_url,
  image_status,
  onFeedbackSubmit,
  onRegenerateImage,
  platform,
  size,
  projectId,
  selected = false,
  onSelect,
  selectable = false,
  fb_ad_settings,
  projectUrl,
  onSettingsSaved
}: SavedAdCardProps) => {
  const [showActions, setShowActions] = useState(false);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localImageUrl, setLocalImageUrl] = useState(imageUrl);
  const [uploading, setUploading] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { toast } = useToast();
  const [isApplyingToAll, setIsApplyingToAll] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      website_url: fb_ad_settings?.website_url || projectUrl || "",
      visible_link: fb_ad_settings?.visible_link || "",
      call_to_action: fb_ad_settings?.call_to_action || "LEARN_MORE",
      ad_language:  fb_ad_settings?.ad_language || "en_US",
      url_parameters: fb_ad_settings?.url_parameters || "",
      browser_addon: fb_ad_settings?.browser_addon || "",
    },
  })

  const handleCopyClick = async () => {
    setIsCopying(true);
    try {
      await navigator.clipboard.writeText(primaryText || "");
      toast({
        title: "Copied to clipboard",
        description: "The ad text has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy ad text to clipboard.",
        variant: "destructive",
      });
    } finally {
      setIsCopying(false);
    }
  };

  const handleDeleteClick = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('ad_feedback')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Ad deleted",
        description: "The ad has been successfully deleted.",
      });
      
      // Trigger parent component refresh if provided
      if (onFeedbackSubmit) {
        onFeedbackSubmit();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the ad.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('ad_feedback')
        .update({ rating, feedback })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Feedback submitted",
        description: "Your feedback has been successfully submitted.",
      });
      
      // Trigger parent component refresh if provided
      if (onFeedbackSubmit) {
        onFeedbackSubmit();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setUploading(true);

    try {
      const isVideo = file.type.startsWith('video/');
      const mediaData: MediaUploadResult = await uploadMedia(file, isVideo ? 'ad-videos' : 'ad-images');
      
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
      
      setLocalImageUrl(mediaData.url);
      toast({
        title: "Success",
        description: `${isVideo ? 'Video' : 'Image'} uploaded successfully`,
      });
      
      // Trigger parent component refresh if provided
      if (onFeedbackSubmit) {
        onFeedbackSubmit();
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (onSettingsSaved) {
        await onSettingsSaved(data, id, isApplyingToAll);
        setIsSettingsOpen(false);
      } else {
        throw new Error("Settings save function not provided.");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    }
  }

  return (
    <Card
      className="relative"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {selectable && (
        <div className="absolute top-2 left-2 z-10">
          <Checkbox
            id={`select-${id}`}
            checked={selected}
            onCheckedChange={(checked) => {
              if (onSelect) {
                onSelect(id, checked === true);
              }
            }}
          />
          <Label
            htmlFor={`select-${id}`}
            className="sr-only"
          >
            Select this ad
          </Label>
        </div>
      )}
      <Card className="relative">
        {showActions && (
          <div className="absolute top-2 right-2 z-10 flex space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopyClick}
                    disabled={isCopying}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Copy Text
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDeleteClick}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Delete Ad
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
        <CardContent className="p-4">
          <div className="aspect-w-16 aspect-h-9 relative rounded-md overflow-hidden">
            <img
              src={localImageUrl || imageUrl}
              alt="Ad Creative"
              className="object-cover w-full h-full"
            />
            {uploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
            <div className="absolute top-2 left-2 flex items-center">
              {image_status === 'pending' && (
                <Badge variant="outline">Pending</Badge>
              )}
              {image_status === 'processing' && (
                <Badge variant="secondary">Processing</Badge>
              )}
              {image_status === 'ready' && (
                <Badge>Ready</Badge>
              )}
              {image_status === 'failed' && (
                <Badge variant="destructive">Failed</Badge>
              )}
            </div>
          </div>
          <div className="mt-2">
            <h3 className="text-sm font-semibold">{headline}</h3>
            <p className="text-xs text-gray-500">{primaryText}</p>
          </div>
          <div className="flex justify-between items-center mt-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Star className="w-4 h-4 mr-2" /> Rate
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Rate this Ad
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4 mr-2" /> Download
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  Download this Ad
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardContent>
      </Card>
      <Collapsible className="w-full border-b">
        <CollapsibleTrigger className="w-full flex items-center justify-between p-2">
          Facebook Ad Settings
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-4 pb-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="website_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://yourwebsite.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="visible_link"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visible Link</FormLabel>
                    <FormControl>
                      <Input placeholder="yourwebsite.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="call_to_action"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Call to Action</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a call to action" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="LEARN_MORE">Learn More</SelectItem>
                        <SelectItem value="SHOP_NOW">Shop Now</SelectItem>
                        <SelectItem value="SIGN_UP">Sign Up</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ad_language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ad Language</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select ad language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="en_US">English (US)</SelectItem>
                        <SelectItem value="es_ES">Spanish (Spain)</SelectItem>
                        <SelectItem value="fr_FR">French (France)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="url_parameters"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Parameters</FormLabel>
                    <FormControl>
                      <Input placeholder="utm_source=facebook" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="browser_addon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Browser Addon</FormLabel>
                    <FormControl>
                      <Input placeholder="Addon description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="apply-to-all"
                  onCheckedChange={(checked) => setIsApplyingToAll(checked === true)}
                />
                <Label htmlFor="apply-to-all">Apply to all selected ads</Label>
              </div>
              <Button type="submit">Save Settings</Button>
            </form>
          </Form>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
