import { Toggle } from "@/components/ui/toggle";
import { Video, Image } from "lucide-react";

interface VideoToggleProps {
  videoAdsEnabled: boolean;
  onToggle: (enabled: boolean) => void;
}

const VideoToggle = ({ videoAdsEnabled, onToggle }: VideoToggleProps) => {
  return (
    <div className="flex items-center justify-end mb-6 space-x-2">
      <span className="text-sm text-gray-600">Image Ads</span>
      <Toggle
        pressed={videoAdsEnabled}
        onPressedChange={onToggle}
        aria-label="Toggle video ads"
        className="data-[state=on]:bg-facebook"
      >
        {videoAdsEnabled ? (
          <Video className="h-4 w-4" />
        ) : (
          <Image className="h-4 w-4" />
        )}
      </Toggle>
      <span className="text-sm text-gray-600">Video Ads</span>
    </div>
  );
};

export default VideoToggle;