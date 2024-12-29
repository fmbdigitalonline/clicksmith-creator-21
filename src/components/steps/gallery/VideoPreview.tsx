import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause, Loader2 } from "lucide-react";

interface VideoPreviewProps {
  url: string;
  onLoad: () => void;
  onError: () => void;
}

const VideoPreview = ({ url, onLoad, onError }: VideoPreviewProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleVideoPlayPause = (videoElement: HTMLVideoElement) => {
    if (videoElement.paused) {
      videoElement.play().catch(console.error);
      setIsPlaying(true);
    } else {
      videoElement.pause();
      setIsPlaying(false);
    }
  };

  const handleLoadedData = () => {
    setIsLoading(false);
    onLoad();
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    console.error('Video loading error:', e);
    setIsLoading(false);
    onError();
  };

  return (
    <div className="relative group">
      <video
        src={url}
        className="object-cover w-full h-full cursor-pointer"
        playsInline
        preload="metadata"
        onClick={(e) => handleVideoPlayPause(e.currentTarget)}
        onLoadedData={handleLoadedData}
        onError={handleVideoError}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80">
          <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
        </div>
      )}
      <Button
        variant="secondary"
        size="icon"
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          const video = e.currentTarget.parentElement?.querySelector('video');
          if (video) handleVideoPlayPause(video);
        }}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
    </div>
  );
};

export default VideoPreview;