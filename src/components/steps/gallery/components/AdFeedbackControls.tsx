
import { useState } from "react";
import { ThumbsUp, ThumbsDown, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

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
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleFeedback = async (feedback: 'like' | 'dislike') => {
    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User must be logged in to provide feedback');
      }

      const rating = feedback === 'like' ? 5 : 1;
      setSelectedRating(rating);

      const { error } = await supabase
        .from('ad_feedback')
        .update({ 
          rating: rating,
          feedback: feedback 
        })
        .eq('id', adId);

      if (error) throw error;

      toast({
        title: "Thank you!",
        description: `Your ${feedback} has been recorded.`,
      });
      
      if (onFeedbackSubmit) {
        onFeedbackSubmit();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit feedback",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex justify-between">
        <div className="flex space-x-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleFeedback('like')}
                disabled={isSubmitting || selectedRating === 5}
                className={selectedRating === 5 ? "bg-green-50 text-green-700 border-green-200" : ""}
              >
                <ThumbsUp className={`h-4 w-4 ${selectedRating === 5 ? "text-green-700" : ""}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Like this ad</TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleFeedback('dislike')}
                disabled={isSubmitting || selectedRating === 1}
                className={selectedRating === 1 ? "bg-red-50 text-red-700 border-red-200" : ""}
              >
                <ThumbsDown className={`h-4 w-4 ${selectedRating === 1 ? "text-red-700" : ""}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Dislike this ad</TooltipContent>
          </Tooltip>
        </div>
        
        <div className="flex items-center">
          <Star className="h-4 w-4 text-yellow-400 mr-1" />
          <span className="text-sm text-gray-600">{selectedRating || '—'}</span>
        </div>
      </div>
    </TooltipProvider>
  );
};
