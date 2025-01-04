import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface AdFeedbackControlsProps {
  adId: string;
  projectId?: string;
  onFeedbackSubmit?: () => void;
}

export const AdFeedbackControls = ({ adId, projectId, onFeedbackSubmit }: AdFeedbackControlsProps) => {
  const [rating, setRating] = useState<number | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const { toast } = useToast();

  const handleFeedback = async (newRating: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to provide feedback",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('ad_feedback')
        .upsert({
          user_id: user.id,
          project_id: projectId,
          rating: newRating,
        });

      if (error) throw error;

      setRating(newRating);
      onFeedbackSubmit?.();

      toast({
        title: "Feedback saved",
        description: "Thank you for your feedback!",
      });
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast({
        title: "Error",
        description: "Failed to save feedback. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleFavorite = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to save favorites",
          variant: "destructive",
        });
        return;
      }

      setIsFavorite(!isFavorite);
      
      const { error } = await supabase
        .from('ad_feedback')
        .upsert({
          user_id: user.id,
          project_id: projectId,
          rating: rating,
          feedback: isFavorite ? null : 'favorite',
        });

      if (error) throw error;

      toast({
        title: isFavorite ? "Removed from favorites" : "Added to favorites",
        description: isFavorite ? "Ad removed from your favorites" : "Ad saved to your favorites",
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setIsFavorite(!isFavorite); // Revert UI state
      toast({
        title: "Error",
        description: "Failed to update favorites. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-t">
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleFeedback(1)}
          className={cn(rating === 1 && "bg-green-100")}
        >
          <ThumbsUp className="w-4 h-4 mr-2" />
          Like
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleFeedback(0)}
          className={cn(rating === 0 && "bg-red-100")}
        >
          <ThumbsDown className="w-4 h-4 mr-2" />
          Dislike
        </Button>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={toggleFavorite}
        className={cn(isFavorite && "bg-pink-100")}
      >
        <Heart className={cn("w-4 h-4 mr-2", isFavorite && "fill-current text-pink-500")} />
        {isFavorite ? "Favorited" : "Favorite"}
      </Button>
    </div>
  );
};