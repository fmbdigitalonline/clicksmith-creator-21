
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LoadingDialogProps {
  isOpen: boolean;
}

const LoadingDialog = ({ isOpen }: LoadingDialogProps) => (
  <Dialog open={isOpen} modal>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Generating Your Landing Page</DialogTitle>
        <DialogDescription>
          Please wait while we analyze your project data and generate a custom landing page.
        </DialogDescription>
      </DialogHeader>
      <div className="flex items-center justify-center p-6">
        <div 
          className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"
          aria-label="Loading indicator"
          role="progressbar"
        />
      </div>
      <DialogDescription>
        We're crafting unique content based on your business details. This may take a few moments.
      </DialogDescription>
    </DialogContent>
  </Dialog>
);

export default LoadingDialog;
