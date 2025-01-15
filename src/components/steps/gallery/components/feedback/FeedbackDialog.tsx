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

interface FeedbackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feedbackText: string;
  onFeedbackChange: (text: string) => void;
  onSubmit: () => void;
}

export const FeedbackDialog = ({
  open,
  onOpenChange,
  feedbackText,
  onFeedbackChange,
  onSubmit,
}: FeedbackDialogProps) => {
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
          onChange={(e) => onFeedbackChange(e.target.value)}
          className="min-h-[100px]"
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>Submit Feedback</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};