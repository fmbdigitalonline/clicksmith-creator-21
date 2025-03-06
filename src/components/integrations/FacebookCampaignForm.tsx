
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CreateCampaignForm from "@/components/integrations/CreateCampaignForm";
import CampaignModeSelection from "@/components/integrations/CampaignModeSelection";
import { Button } from "@/components/ui/button";

interface FacebookCampaignFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess?: () => void;
}

export default function FacebookCampaignForm({ 
  open, 
  onOpenChange, 
  projectId,
  onSuccess
}: FacebookCampaignFormProps) {
  const [step, setStep] = useState<"mode-selection" | "form">("mode-selection");
  const [selectedMode, setSelectedMode] = useState<"manual" | "semi-automatic" | "automatic">("manual");

  const handleModeSelect = (mode: "manual" | "semi-automatic" | "automatic") => {
    setSelectedMode(mode);
  };

  const handleContinue = () => {
    setStep("form");
  };

  const handleBack = () => {
    setStep("mode-selection");
  };

  const handleClose = () => {
    // Reset state when dialog is closed
    setTimeout(() => {
      setStep("mode-selection");
      setSelectedMode("manual");
    }, 300); // Small delay to avoid seeing the reset during close animation
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Facebook Campaign</DialogTitle>
          <DialogDescription>
            Create a new Facebook ad campaign for your project
          </DialogDescription>
        </DialogHeader>
        
        {step === "mode-selection" ? (
          <>
            <CampaignModeSelection 
              onModeSelect={handleModeSelect}
              selectedMode={selectedMode}
            />
            <div className="flex justify-end mt-6">
              <Button onClick={handleContinue}>
                Continue
              </Button>
            </div>
          </>
        ) : (
          <CreateCampaignForm 
            projectId={projectId} 
            creationMode={selectedMode}
            onSuccess={() => {
              handleClose();
              if (onSuccess) onSuccess();
            }}
            onCancel={handleClose}
            onBack={handleBack}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
