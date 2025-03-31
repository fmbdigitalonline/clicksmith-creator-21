
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Star, ThumbsUp, ThumbsDown } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

export interface AdFeedbackControlsProps {
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
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation('gallery');

  const effectiveAdId = adId || (variant?.id ? variant.id : undefined);

  const handleStarClick = (value: number) => {
    setRating(value === rating ? null : value);
  };

  const handleFeedbackChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFeedback(event.target.value);
  };

  const handleLikeDislike = async (isLike: boolean) => {
    if (!effectiveAdId) {
      if (onCreateProject) {
        onCreateProject();
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('ad_feedback')
        .update({
          rating: isLike ? 5 : 1,
          feedback: feedback || (isLike ? t('feedback.like_default', 'I like this ad') : t('feedback.dislike_default', 'I dislike this ad')),
        })
        .eq('id', effectiveAdId);

      if (error) throw error;

      toast({
        title: isLike ? t('feedback.like_success', 'Thanks for your feedback!') : t('feedback.dislike_success', 'Thanks for your feedback!'),
        description: isLike ? t('feedback.like_description', 'We appreciate your positive feedback.') : t('feedback.dislike_description', 'Your feedback helps us improve.'),
      });

      if (onFeedbackSubmit) {
        onFeedbackSubmit();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: t('feedback.error', 'Error'),
        description: t('feedback.error_description', 'Failed to submit feedback. Please try again.'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomFeedback = async () => {
    if (!effectiveAdId || !rating) {
      toast({
        title: t('feedback.rating_required', 'Rating Required'),
        description: t('feedback.rating_description', 'Please select a star rating before submitting.'),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('ad_feedback')
        .update({
          rating,
          feedback: feedback || t('feedback.default', 'Custom feedback provided'),
        })
        .eq('id', effectiveAdId);

      if (error) throw error;

      toast({
        title: t('feedback.success', 'Feedback Submitted'),
        description: t('feedback.success_description', 'Thank you for your detailed feedback!'),
      });

      // Reset form
      setRating(null);
      setFeedback("");

      if (onFeedbackSubmit) {
        onFeedbackSubmit();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: t('feedback.error', 'Error'),
        description: t('feedback.error_description', 'Failed to submit feedback. Please try again.'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex space-x-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <Star
              key={value}
              className={`h-5 w-5 cursor-pointer ${
                value <= (rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
              }`}
              onClick={() => handleStarClick(value)}
            />
          ))}
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            className="text-green-600 border-green-200 hover:bg-green-50"
            disabled={isSubmitting}
            onClick={() => handleLikeDislike(true)}
          >
            <ThumbsUp className="h-4 w-4 mr-1" />
            {t('actions.like', 'Like')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-red-600 border-red-200 hover:bg-red-50"
            disabled={isSubmitting}
            onClick={() => handleLikeDislike(false)}
          >
            <ThumbsDown className="h-4 w-4 mr-1" />
            {t('actions.dislike', 'Dislike')}
          </Button>
        </div>
      </div>
      
      <Textarea
        placeholder={t('feedback.placeholder', 'Share your thoughts on this ad (optional)')}
        value={feedback}
        onChange={handleFeedbackChange}
        className="h-20 resize-none"
      />
      
      <Button
        className="w-full"
        disabled={isSubmitting}
        onClick={handleCustomFeedback}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {t('actions.submitting', 'Submitting...')}
          </>
        ) : (
          t('actions.submit_feedback', 'Submit Feedback')
        )}
      </Button>
    </div>
  );
};
