
import { Loader2, AlertTriangle, ImageOff, Video, Play } from "lucide-react";

interface MediaPreviewProps {
  imageUrl: string | null;
  isVideo?: boolean;
  format: {
    width: number;
    height: number;
    label: string;
  };
  status?: 'pending' | 'processing' | 'ready' | 'failed';
}

const MediaPreview = ({ imageUrl, isVideo, format, status }: MediaPreviewProps) => {
  if (!imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center text-gray-500">
          {isVideo ? (
            <Video className="h-6 w-6 md:h-10 md:w-10 mb-1 md:mb-2 text-gray-400" />
          ) : (
            <ImageOff className="h-6 w-6 md:h-10 md:w-10 mb-1 md:mb-2 text-gray-400" />
          )}
          <p className="text-xs md:text-sm">No {isVideo ? 'video' : 'image'} available</p>
        </div>
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="w-full h-full relative">
        <video 
          src={imageUrl} 
          controls
          className="w-full h-full object-cover" 
          poster={imageUrl + '?poster=true'}
        >
          Your browser does not support the video tag.
        </video>
        {status === 'processing' && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="bg-white p-1 md:p-2 rounded-full">
              <Loader2 className="h-4 w-4 md:h-6 md:w-6 animate-spin text-primary" />
            </div>
          </div>
        )}
        
        {status === 'failed' && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="bg-red-50 p-2 md:p-4 rounded-md border border-red-200">
              <div className="flex flex-col items-center">
                <AlertTriangle className="h-4 w-4 md:h-6 md:w-6 text-red-500 mb-1 md:mb-2" />
                <p className="text-xs md:text-sm font-medium text-red-700">Video processing failed</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <img
        src={imageUrl}
        alt={`Ad preview (${format.label})`}
        className="object-cover w-full h-full transition-transform duration-300 ease-in-out"
      />
      
      {status === 'processing' && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="bg-white p-1 md:p-2 rounded-full">
            <Loader2 className="h-4 w-4 md:h-6 md:w-6 animate-spin text-primary" />
          </div>
        </div>
      )}
      
      {status === 'failed' && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="bg-red-50 p-2 md:p-4 rounded-md border border-red-200">
            <div className="flex flex-col items-center">
              <AlertTriangle className="h-4 w-4 md:h-6 md:w-6 text-red-500 mb-1 md:mb-2" />
              <p className="text-xs md:text-sm font-medium text-red-700">Image processing failed</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaPreview;
