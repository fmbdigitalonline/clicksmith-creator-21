import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";
import { useState } from "react";

interface MediaPreviewProps {
  imageUrl: string | null;
  isVideo?: boolean;
  onVideoPlayPause?: (video: HTMLVideoElement) => void;
}

const MediaPreview = ({ imageUrl, isVideo = false, onVideoPlayPause }: MediaPreviewProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  if (!imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">{isVideo ? 'Video preview not available' : 'Image preview not available'}</p>
      </div>
    );
  }

  if (isVideo) {
    return (
      <>
        <video
          src={imageUrl}
          className="object-cover w-full h-full cursor-pointer"
          playsInline
          preload="metadata"
          onClick={(e) => onVideoPlayPause?.(e.currentTarget)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            const video = e.currentTarget.parentElement?.querySelector('video');
            if (video) onVideoPlayPause?.(video);
          }}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
      </>
    );
  }

  return (
    <img
      src={imageUrl}
      alt="Ad preview"
      className="object-cover w-full h-full"
    />
  );
};

export default MediaPreview;