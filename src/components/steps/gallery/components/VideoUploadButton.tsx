
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileVideo, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { uploadMedia } from "@/utils/uploadUtils";

interface VideoUploadButtonProps {
  onUploadComplete: (mediaInfo: { url: string; isVideo: boolean; fileType: string }) => void;
  variant?: "outline" | "default" | "destructive" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

const VideoUploadButton = ({ 
  onUploadComplete,
  variant = "outline",
  size = "default",
  className = ""
}: VideoUploadButtonProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const mediaInfo = await uploadMedia(file, 'ad-videos');
      onUploadComplete(mediaInfo);
      
      toast({
        title: "Upload successful",
        description: "Your video has been uploaded successfully.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload video",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      // Reset file input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  return (
    <div className="flex items-center">
      <Button
        variant={variant}
        size={size} 
        className={className}
        disabled={isUploading}
        onClick={() => document.getElementById('video-upload')?.click()}
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <FileVideo className="mr-2 h-4 w-4" />
            Upload Video
          </>
        )}
      </Button>
      <input
        id="video-upload"
        type="file"
        accept="video/mp4,video/quicktime,video/webm"
        className="hidden"
        onChange={handleUpload}
        disabled={isUploading}
      />
    </div>
  );
};

export default VideoUploadButton;
