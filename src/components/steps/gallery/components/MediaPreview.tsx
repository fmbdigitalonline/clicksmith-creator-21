
import { Loader2, AlertTriangle, ImageOff, Video, Play, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MediaPreviewProps {
  imageUrl: string | null;
  isVideo?: boolean;
  format: {
    width: number;
    height: number;
    label: string;
  };
  status?: 'pending' | 'processing' | 'ready' | 'failed';
  onRetry?: () => void;
}

const MediaPreview = ({ imageUrl, isVideo, format, status, onRetry }: MediaPreviewProps) => {
  // If no image URL is provided, show an empty state
  if (!imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-md">
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

  // Video media type handling
  if (isVideo) {
    return (
      <div className="w-full h-full relative">
        <video 
          src={imageUrl} 
          controls
          controlsList="nodownload" // Prevents default download button
          className="w-full h-full object-cover rounded-md" 
          poster={imageUrl + '?poster=true'}
          playsInline // Better mobile experience
        >
          Your browser does not support the video tag.
        </video>
        
        {/* Processing state overlay */}
        {status === 'processing' && (
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-sm">
            <div className="bg-white p-1 md:p-2 rounded-full">
              <Loader2 className="h-4 w-4 md:h-6 md:w-6 animate-spin text-primary" />
            </div>
          </div>
        )}
        
        {/* Pending state overlay */}
        {status === 'pending' && (
          <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center backdrop-blur-sm">
            <div className="bg-white p-1 md:p-2 rounded-full mb-2">
              <AlertTriangle className="h-4 w-4 md:h-6 md:w-6 text-amber-500" />
            </div>
            <p className="text-xs md:text-sm font-medium text-white">Video needs processing</p>
            {onRetry && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
                className="mt-2 bg-white/90 hover:bg-white"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Process now
              </Button>
            )}
          </div>
        )}
        
        {/* Failed state overlay */}
        {status === 'failed' && (
          <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center">
            <div className="bg-red-50 p-2 md:p-4 rounded-md border border-red-200">
              <div className="flex flex-col items-center">
                <AlertTriangle className="h-4 w-4 md:h-6 md:w-6 text-red-500 mb-1 md:mb-2" />
                <p className="text-xs md:text-sm font-medium text-red-700">Video processing failed</p>
                {onRetry && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={onRetry}
                    className="mt-2"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Retry
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Play button overlay - only for ready videos */}
        {status === 'ready' && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <div className="bg-black/30 rounded-full p-3 hover:bg-black/50 transition-colors cursor-pointer">
              <Play className="h-8 w-8 text-white fill-white" />
            </div>
          </div>
        )}
      </div>
    );
  }

  // Image media type handling
  return (
    <div className="w-full h-full relative">
      <img
        src={imageUrl}
        alt={`Ad preview (${format.label})`}
        className="object-cover w-full h-full rounded-md transition-transform duration-300 ease-in-out"
        loading="lazy" // Better performance
      />
      
      {/* Processing state overlay */}
      {status === 'processing' && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-1 md:p-2 rounded-full">
            <Loader2 className="h-4 w-4 md:h-6 md:w-6 animate-spin text-primary" />
          </div>
        </div>
      )}
      
      {/* Pending state overlay */}
      {status === 'pending' && (
        <div className="absolute inset-0 bg-black/20 flex flex-col items-center justify-center backdrop-blur-sm">
          <div className="bg-white p-1 md:p-2 rounded-full mb-2">
            <AlertTriangle className="h-4 w-4 md:h-6 md:w-6 text-amber-500" />
          </div>
          <p className="text-xs md:text-sm font-medium text-white">Image needs processing</p>
          {onRetry && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRetry}
              className="mt-2 bg-white/90 hover:bg-white"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Process now
            </Button>
          )}
        </div>
      )}
      
      {/* Failed state overlay */}
      {status === 'failed' && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="bg-red-50 p-2 md:p-4 rounded-md border border-red-200">
            <div className="flex flex-col items-center">
              <AlertTriangle className="h-4 w-4 md:h-6 md:w-6 text-red-500 mb-1 md:mb-2" />
              <p className="text-xs md:text-sm font-medium text-red-700">Image processing failed</p>
              {onRetry && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRetry}
                  className="mt-2"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MediaPreview;
