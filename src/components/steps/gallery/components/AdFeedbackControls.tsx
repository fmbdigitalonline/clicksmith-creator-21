
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";

interface AdFeedbackControlsProps {
  adId?: string;
  projectId?: string;
  onFeedbackSubmit?: () => void;
  variant?: any;
  onCreateProject?: () => void;
}

export const AdFeedbackControls = ({ 
  adId, 
  projectId, 
  onFeedbackSubmit,
  variant,
  onCreateProject
}: AdFeedbackControlsProps) => {
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const { toast } = useToast();

  // Get the adId from the variant if it's not directly provided
  const effectiveAdId = adId || (variant?.id || '');

  const saveFeedbackToDatabase = async (rating: number, feedbackText: string | null) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated');
    }

    const feedbackData = {
      user_id: user.id,
      project_id: projectId,
      ad_id: effectiveAdId,
      rating: rating,
      feedback: feedbackText
    };

    const { error: updateError } = await supabase
      .from('ad_feedback')
      .update(feedbackData)
      .eq('user_id', user.id)
      .eq('ad_id', effectiveAdId);

    if (updateError) {
      const { error: insertError } = await supabase
        .from('ad_feedback')
        .insert(feedbackData);

      if (insertError) throw insertError;
    }
  };

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

      // If dislike is clicked, show feedback input
      if (newRating === 0) {
        setRating(newRating);
        setShowFeedbackInput(true);
        return;
      }

      // For likes, save immediately
      setIsSaving(true);
      await saveFeedbackToDatabase(newRating, null);
      setRating(newRating);
      onFeedbackSubmit?.();
      // If specified from AdPreviewCard, we use onCreateProject
      if (onFeedbackSubmit) {
        onFeedbackSubmit();
      } else if (onCreateProject) {
        onCreateProject();
      }

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
    } finally {
      setIsSaving(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (rating === null) return;
    
    try {
      setIsSaving(true);
      await saveFeedbackToDatabase(rating, feedback);
      setShowFeedbackInput(false);
      setFeedback("");
      
      // Call the appropriate callback
      if (onFeedbackSubmit) {
        onFeedbackSubmit();
      } else if (onCreateProject) {
        onCreateProject();
      }

      toast({
        title: "Feedback saved",
        description: "Thank you for your detailed feedback!",
      });
    } catch (error) {
      console.error('Error saving feedback:', error);
      toast({
        title: "Error",
        description: "Failed to save feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-x-2">
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFeedback(1)}
            className={cn(rating === 1 && "bg-green-100")}
            disabled={isSaving}
          >
            <ThumbsUp className="w-4 h-4 mr-2" />
            Like
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFeedback(0)}
            className={cn(rating === 0 && "bg-red-100")}
            disabled={isSaving}
          >
            <ThumbsDown className="w-4 h-4 mr-2" />
            Dislike
          </Button>
        </div>
      </div>

      {showFeedbackInput && (
        <div className="space-y-2">
          <Textarea
            placeholder="Please tell us why you didn't like this ad..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[80px]"
          />
          <div className="flex justify-end">
            <Button
              size="sm"
              onClick={handleFeedbackSubmit}
              disabled={isSaving || !feedback.trim()}
            >
              Submit Feedback
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
