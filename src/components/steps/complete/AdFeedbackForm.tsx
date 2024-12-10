import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";

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
      <RadioGroup
        value={rating}
        onValueChange={onRatingChange}
        className="flex space-x-4 mb-4"
      >
        {[1, 2, 3, 4, 5].map((value) => (
          <div key={value} className="flex items-center space-x-2">
            <RadioGroupItem value={value.toString()} id={`rating-${value}`} />
            <Label htmlFor={`rating-${value}`} className="flex items-center gap-1">
              {value} <Star className="w-4 h-4" />
            </Label>
          </div>
        ))}
      </RadioGroup>
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