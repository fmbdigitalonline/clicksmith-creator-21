
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  MoreHorizontal, 
  Pencil, 
  Copy, 
  Trash, 
  ArrowUpToLine, 
  Download, 
  Share, 
  Link, 
  Video
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";

interface AdQuickActionsProps {
  adId: string;
  onUpdate?: () => void;
  projectId?: string;
  mediaType?: 'image' | 'video';
  imageUrl?: string;
}

export const AdQuickActions = ({ 
  adId, 
  onUpdate, 
  projectId,
  mediaType = 'image',
  imageUrl
}: AdQuickActionsProps) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Handle deleting an ad
  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('ad_feedback')
        .delete()
        .eq('id', adId);
      
      if (error) throw error;
      
      toast({
        title: "Ad deleted",
        description: "The ad has been deleted successfully.",
      });
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error deleting ad:", error);
      toast({
        title: "Error",
        description: "Failed to delete the ad. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Handle duplicating an ad
  const handleDuplicate = async () => {
    setIsLoading(true);
    try {
      // First get the ad data
      const { data, error: fetchError } = await supabase
        .from('ad_feedback')
        .select('*')
        .eq('id', adId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Create a duplicate with a new ID
      const duplicateAd = {
        ...data,
        id: undefined, // Remove ID so Supabase generates a new one
        created_at: new Date().toISOString(),
        headline: data.headline ? `${data.headline} (Copy)` : "Untitled Ad (Copy)",
      };
      
      const { error: insertError } = await supabase
        .from('ad_feedback')
        .insert(duplicateAd);
      
      if (insertError) throw insertError;
      
      toast({
        title: "Ad duplicated",
        description: "A copy of the ad has been created.",
      });
      
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("Error duplicating ad:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate the ad. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle downloading an image
  const handleDownload = () => {
    if (!imageUrl) {
      toast({
        title: "Error",
        description: "Image URL not available for download.",
        variant: "destructive",
      });
      return;
    }
    
    // Create a link element and trigger download
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `ad-${adId}.${mediaType === 'video' ? 'mp4' : 'jpg'}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: `${mediaType === 'video' ? 'Video' : 'Image'} downloaded`,
      description: `The ${mediaType} has been downloaded to your device.`,
    });
  };

  // Handle copying link to clipboard
  const handleCopyLink = () => {
    if (!imageUrl) {
      toast({
        title: "Error",
        description: "Image URL not available to copy.",
        variant: "destructive",
      });
      return;
    }
    
    navigator.clipboard.writeText(imageUrl);
    
    toast({
      title: "Link copied",
      description: "The media URL has been copied to clipboard.",
    });
  };

  // Handle conversion to video (placeholder for future implementation)
  const handleConvertToVideo = () => {
    if (mediaType !== 'image') {
      toast({
        title: "Not applicable",
        description: "Only images can be converted to videos.",
        variant: "destructive",
      });
      return;
    }
    
    toast({
      title: "Coming soon",
      description: "Video conversion will be available soon.",
    });
  };
  
  // Handle edit navigation
  const handleEditAd = () => {
    // Make sure we're navigating with the correct path
    window.location.href = `/gallery/edit/${adId}`;
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 hover:bg-muted"
          >
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={handleEditAd}>
            <Pencil className="mr-2 h-4 w-4" />
            <span>Edit</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            <span>Duplicate</span>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            <span>Download</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleCopyLink}>
            <Link className="mr-2 h-4 w-4" />
            <span>Copy link</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => {
            navigator.share({
              title: "Ad Share",
              text: "Check out this ad",
              url: window.location.href
            }).catch(() => {
              // Fallback if Web Share API is not available
              handleCopyLink();
            });
          }}>
            <Share className="mr-2 h-4 w-4" />
            <span>Share</span>
          </DropdownMenuItem>
          
          {mediaType === 'image' && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleConvertToVideo}>
                <Video className="mr-2 h-4 w-4" />
                <span>Create Video</span>
              </DropdownMenuItem>
            </>
          )}
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem 
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-red-600 focus:text-red-600"
          >
            <Trash className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the ad.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
