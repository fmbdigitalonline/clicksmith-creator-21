import { VideoAdVariant } from "@/types/videoAdTypes";
import { Loader2 } from "lucide-react";

interface MediaPreviewProps {
  imageUrl?: string | null;
  videoUrl?: string;
  isVideo?: boolean;
  format: {
    width: number;
    height: number;
    label: string;
  };
  status?: VideoAdVariant['status'];
  error?: string;
}

const MediaPreview = ({ 
  imageUrl, 
  videoUrl,
  isVideo = false,
  format,
  status = 'completed',
  error
}: MediaPreviewProps) => {
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-red-500">
        <p className="text-sm text-center px-4">{error}</p>
      </div>
    );
  }

  if (status === 'generating' || status === 'pending') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-facebook mb-2" />
        <p className="text-sm text-gray-600">Generating video...</p>
      </div>
    );
  }

  if (isVideo && videoUrl) {
    return (
      <video
        className="w-full h-full object-cover"
        controls
        style={{
          aspectRatio: `${format.width} / ${format.height}`,
        }}
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    );
  }

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt="Ad preview"
        className="w-full h-full object-cover"
        style={{
          aspectRatio: `${format.width} / ${format.height}`,
        }}
      />
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <p className="text-sm text-gray-500">No preview available</p>
    </div>
  );
};

export default MediaPreview;