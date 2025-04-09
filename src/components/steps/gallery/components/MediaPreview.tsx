
import { Loader2, AlertTriangle, ImageOff } from "lucide-react";

interface MediaPreviewProps {
  imageUrl: string | null;
  isVideo?: boolean;
  format: {
    width: number;
    height: number;
    label: string;
  };
  status?: 'pending' | 'processing' | 'ready' | 'failed';
  timestamp?: number;
}

const MediaPreview = ({ imageUrl, isVideo, format, status, timestamp }: MediaPreviewProps) => {
  if (isVideo) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Video Preview</p>
      </div>
    );
  }

  if (!imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center text-gray-500">
          <ImageOff className="h-10 w-10 mb-2 text-gray-400" />
          <p>No image available</p>
        </div>
      </div>
    );
  }
  
  // Add cache-busting query parameter to the image URL
  const cacheBustedUrl = timestamp ? 
    `${imageUrl}${imageUrl.includes('?') ? '&' : '?'}t=${timestamp}` : 
    imageUrl;

  return (
    <div className="w-full h-full relative">
      <img
        src={cacheBustedUrl}
        alt={`Ad preview (${format.label})`}
        className="object-cover w-full h-full transition-transform duration-300 ease-in-out"
      />
      
      {status === 'processing' && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="bg-white p-2 rounded-full">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </div>
      )}
      
      {status === 'failed' && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="bg-red-50 p-4 rounded-md border border-red-200">
            <div className="flex flex-col items-center">
              <AlertTriangle className="h-6 w-6 text-red-500 mb-2" />
              <p className="text-red-700 text-sm font-medium">Image processing failed</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaPreview;
