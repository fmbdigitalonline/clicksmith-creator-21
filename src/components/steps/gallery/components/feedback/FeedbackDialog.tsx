import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (feedback: string) => void;
}

export const FeedbackDialog = ({
  open,
  onOpenChange,
  onSubmit,
}: FeedbackDialogProps) => {
  const [feedbackText, setFeedbackText] = useState("");

  const handleSubmit = () => {
    onSubmit(feedbackText);
    setFeedbackText("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Provide Feedback</DialogTitle>
          <DialogDescription>
            Please let us know why you disliked this ad. Your feedback helps us improve.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="What could be improved?"
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.target.value)}
          className="min-h-[100px]"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Submit Feedback</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};