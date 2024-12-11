import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";

interface AdFeedbackFormProps {
  rating: string;
  feedback: string;
  onRatingChange: (value: string) => void;
  onFeedbackChange: (value: string) => void;
}

const AdFeedbackForm = ({
  rating,
  feedback,
  onRatingChange,
  onFeedbackChange,
}: AdFeedbackFormProps) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Provide Feedback</h3>
      <div className="flex space-x-4 mb-4">
        <Button
          variant={rating === "1" ? "default" : "outline"}
          onClick={() => onRatingChange("1")}
          className="flex-1"
        >
          <ThumbsUp className="w-4 h-4 mr-2" />
          Like
        </Button>
        <Button
          variant={rating === "0" ? "default" : "outline"}
          onClick={() => onRatingChange("0")}
          className="flex-1"
        >
          <ThumbsDown className="w-4 h-4 mr-2" />
          Dislike
        </Button>
      </div>
      <Textarea
        placeholder="Share your thoughts about the generated ads..."
        value={feedback}
        onChange={(e) => onFeedbackChange(e.target.value)}
        className="min-h-[100px]"
      />
    </div>
  );
};

export default AdFeedbackForm;