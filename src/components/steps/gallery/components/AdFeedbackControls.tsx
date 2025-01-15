import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useParams } from "react-router-dom";
import FeedbackDialog from "./feedback/FeedbackDialog";
import LikeDislikeButtons from "./feedback/LikeDislikeButtons";
import StarRating from "./feedback/StarRating";

interface AdFeedbackControlsProps {
  adId: string;
  projectId?: string;
  onFeedbackSubmit?: () => void;
}

export const AdFeedbackControls = ({ adId, projectId, onFeedbackSubmit }: AdFeedbackControlsProps) => {
  const [rating, setRating] = useState<number | null>(null);
  const [starRating, setStarRating] = useState<number>(0);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const { toast } = useToast();

  const handleStarClick = async (newRating: number) => {
    try {
      setStarRating(newRating);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to rate ads",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('ad_feedback')
        .upsert({
          user_id: user.id,
          project_id: projectId,
          ad_id: adId,
          rating: newRating,
        }, {
          onConflict: 'user_id,ad_id'
        });

      if (error) throw error;

      toast({
        title: "Rating saved",
        description: "Thank you for your feedback!",
      });
      
      onFeedbackSubmit?.();
    } catch (error) {
      console.error('Error saving star rating:', error);
      toast({
        title: "Error",
        description: "Failed to save rating",
        variant: "destructive",
      });
    }
  };

  const handleFeedbackSubmit = async (feedback: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to submit feedback",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('ad_feedback')
        .upsert({
          user_id: user.id,
          project_id: projectId,
          ad_id: adId,
          rating: rating,
          feedback: feedback,
        }, {
          onConflict: 'user_id,ad_id'
        });

      if (error) throw error;

      setShowFeedbackDialog(false);
      toast({
        title: "Feedback saved",
        description: "Thank you for your feedback!",
      });

      onFeedbackSubmit?.();
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast({
        title: "Error",
        description: "Failed to save feedback",
        variant: "destructive",
      });
    }
  };

  const handleLike = () => {
    setRating(1);
    handleStarClick(5);
  };

  const handleDislike = () => {
    setRating(0);
    setShowFeedbackDialog(true);
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 w-full">
      <div className="flex items-center space-x-2 w-full sm:w-auto">
        <LikeDislikeButtons
          rating={rating}
          onLike={handleLike}
          onDislike={handleDislike}
        />
        <StarRating rating={starRating} onRate={handleStarClick} />
      </div>

      <FeedbackDialog
        open={showFeedbackDialog}
        onOpenChange={setShowFeedbackDialog}
        onSubmit={handleFeedbackSubmit}
      />
    </div>
  );
};