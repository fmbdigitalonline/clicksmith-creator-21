import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

interface AdPreviewVideoProps {
  imageUrl: string | null;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  selectedSize: {
    width: number;
    height: number;
  };
}

const AdPreviewVideo = ({ imageUrl, isPlaying, setIsPlaying, selectedSize }: AdPreviewVideoProps) => {
  const handleVideoPlayPause = (videoElement: HTMLVideoElement) => {
    if (videoElement.paused) {
      videoElement.play();
      setIsPlaying(true);
    } else {
      videoElement.pause();
      setIsPlaying(false);
    }
  };

  if (!imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Video preview not available</p>
      </div>
    );
  }

  return (
    <>
      <video
        src={imageUrl}
        className="object-cover w-full h-full cursor-pointer"
        playsInline
        preload="metadata"
        onClick={(e) => handleVideoPlayPause(e.currentTarget)}
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
          if (video) handleVideoPlayPause(video);
        }}
      >
        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
      </Button>
    </>
  );
};

export default AdPreviewVideo;