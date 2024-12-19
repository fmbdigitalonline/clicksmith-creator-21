import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Save, Play, Pause } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AdPreviewCardProps {
  variant: {
    platform: string;
    image: {
      url: string;
      prompt: string;
    };
    size: {
      width: number;
      height: number;
      label: string;
    };
    format?: string;
    specs?: {
      designRecommendations?: {
        fileTypes: string[];
        aspectRatios: string;
      };
      textRecommendations?: {
        primaryTextLength: string;
        headlineLength: string;
      };
    };
    headline: string;
    description: string;
    callToAction: string;
  };
  onCreateProject: () => void;
  isVideo?: boolean;
}

const AdPreviewCard = ({ variant, onCreateProject, isVideo = false }: AdPreviewCardProps) => {
  const [isSaving, setSaving] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  const handleVideoPlayPause = (videoElement: HTMLVideoElement) => {
    if (videoElement.paused) {
      videoElement.play();
      setIsPlaying(true);
    } else {
      videoElement.pause();
      setIsPlaying(false);
    }
  };

  const handleSaveAndDownload = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User must be logged in to save ad');
      }

      if (!onCreateProject) {
        toast({
          title: "No Project Selected",
          description: "Please create a project to save your ad.",
          action: (
            <Button variant="outline" onClick={onCreateProject}>
              Create Project
            </Button>
          ),
        });
        return;
      }

      const response = await fetch(variant.image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${variant.platform}-${isVideo ? 'video' : 'ad'}-${variant.size.width}x${variant.size.height}.${isVideo ? 'mp4' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success!",
        description: `Your ${variant.format || variant.size.label} ${isVideo ? 'video' : 'ad'} has been saved and downloaded.`,
      });
    } catch (error) {
      console.error('Error saving ad:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save ad or download image.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const aspectRatioClass = () => {
    const ratio = variant.size.height / variant.size.width;
    if (ratio === 1) return "aspect-square";
    if (ratio > 1) return "aspect-[9/16]";
    return "aspect-video";
  };

  return (
    <Card className="h-full flex flex-col">
      <div className={`relative overflow-hidden ${aspectRatioClass()}`}>
        {isVideo ? (
          <>
            <video
              src={variant.image.url}
              className="w-full h-full object-cover"
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
        ) : (
          <img
            src={variant.image.url}
            alt={variant.headline}
            className="w-full h-full object-cover"
          />
        )}
      </div>
      <CardContent className="p-4 space-y-4 flex-grow flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-lg line-clamp-1">{variant.headline}</h3>
            <span className="text-sm text-gray-500">{variant.format || variant.size.label}</span>
          </div>
          <p className="text-gray-600 line-clamp-2">{variant.description}</p>
          <p className="text-facebook font-medium">{variant.callToAction}</p>
          <div className="text-sm text-gray-500 space-y-1">
            <p>Size: {variant.size.width}x{variant.size.height}</p>
            {variant.specs?.designRecommendations && (
              <>
                <p>Format: {variant.specs.designRecommendations.fileTypes.join(", ")}</p>
                <p>Aspect Ratio: {variant.specs.designRecommendations.aspectRatios}</p>
              </>
            )}
          </div>
        </div>

        <Button
          onClick={handleSaveAndDownload}
          className="w-full bg-facebook hover:bg-facebook/90 mt-4"
          disabled={isSaving}
        >
          {isSaving ? (
            "Saving..."
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save & Download
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default AdPreviewCard;