import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FeedbackDialog } from "./feedback/FeedbackDialog";
import { StarRating } from "./feedback/StarRating";
import { LikeDislikeButtons } from "./feedback/LikeDislikeButtons";

interface AdFeedbackControlsProps {
  adId: string;
  projectId?: string;
  onFeedbackSubmit?: () => void;
}

export const AdFeedbackControls = ({ 
  adId, 
  projectId, 
  onFeedbackSubmit 
}: AdFeedbackControlsProps) => {
  const [rating, setRating] = useState<number | null>(null);
  const [starRating, setStarRating] = useState<number>(0);
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const { toast } = useToast();

  const saveFeedback = async (feedbackData: {
    rating: number;
    feedback?: string;
  }) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to provide feedback",
          variant: "destructive",
        });
        return false;
      }

      const isValidUUID = projectId && 
                         projectId !== "new" && 
                         /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(projectId);

      const { error } = await supabase
        .from('ad_feedback')
        .insert({
          user_id: user.id,
          project_id: isValidUUID ? projectId : null,
          ad_id: adId,
          rating: feedbackData.rating,
          feedback: feedbackData.feedback || null,
          created_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Feedback saved",
        description: "Thank you for your feedback!",
      });

      return true;
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast({
        title: "Error",
        description: "Failed to save feedback. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const handleStarClick = async (stars: number) => {
    setStarRating(stars);
    const success = await saveFeedback({
      rating: stars,
    });

    if (success) {
      onFeedbackSubmit?.();
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim()) {
      toast({
        title: "Feedback required",
        description: "Please provide some feedback before submitting.",
        variant: "destructive",
      });
      return;
    }

    const success = await saveFeedback({
      rating: rating || 0,
      feedback: feedbackText,
    });

    if (success) {
      setShowFeedbackDialog(false);
      setFeedbackText("");
      onFeedbackSubmit?.();
    }
  };

  const handleLike = async () => {
    setRating(1);
    const success = await saveFeedback({
      rating: 1,
    });

    if (success) {
      onFeedbackSubmit?.();
    }
  };

  const handleDislike = () => {
    setRating(0);
    setShowFeedbackDialog(true);
  };

  return (
    <>
      <div className="flex items-center justify-between space-x-2">
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
        feedbackText={feedbackText}
        onFeedbackChange={setFeedbackText}
        onSubmit={handleFeedbackSubmit}
      />
    </>
  );
};