
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CreateCampaignForm from "@/components/integrations/CreateCampaignForm";
import CampaignModeSelection from "@/components/integrations/CampaignModeSelection";
import { Button } from "@/components/ui/button";
import { ProjectSelector } from "@/components/gallery/components/ProjectSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdSelectionGallery from "@/components/integrations/AdSelectionGallery";

interface FacebookCampaignFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  onSuccess?: () => void;
}

export default function FacebookCampaignForm({ 
  open, 
  onOpenChange, 
  projectId: initialProjectId,
  onSuccess
}: FacebookCampaignFormProps) {
  const [step, setStep] = useState<"mode-selection" | "form">("mode-selection");
  const [selectedMode, setSelectedMode] = useState<"manual" | "semi-automatic" | "automatic">("manual");
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || "");
  const [formTab, setFormTab] = useState<"details" | "ads">("details");
  const [selectedAdIds, setSelectedAdIds] = useState<string[]>([]);

  const handleModeSelect = (mode: "manual" | "semi-automatic" | "automatic") => {
    setSelectedMode(mode);
  };

  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    // If they select a project and were in a disabled mode, switch to semi-automatic
    if (selectedMode !== "manual" && !selectedProjectId) {
      setSelectedMode("semi-automatic");
    }
  };

  const handleContinue = () => {
    // Only allow non-manual modes if a project is selected
    if ((selectedMode === "semi-automatic" || selectedMode === "automatic") && !selectedProjectId) {
      return;
    }
    setStep("form");
  };

  const handleBack = () => {
    setStep("mode-selection");
  };

  const handleClose = () => {
    // Reset state when dialog is closed
    setTimeout(() => {
      setStep("mode-selection");
      if (!initialProjectId) {
        setSelectedProjectId("");
      }
      setSelectedMode("manual");
      setFormTab("details");
      setSelectedAdIds([]);
    }, 300); // Small delay to avoid seeing the reset during close animation
    onOpenChange(false);
  };

  const handleAdsSelected = (adIds: string[]) => {
    setSelectedAdIds(adIds);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Facebook Campaign</DialogTitle>
          <DialogDescription>
            Create a new Facebook ad campaign for your project
          </DialogDescription>
        </DialogHeader>
        
        {step === "mode-selection" ? (
          <>
            {!initialProjectId && (
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">Select Project</h3>
                <ProjectSelector 
                  onSelect={handleProjectSelect}
                  selectedProjectId={selectedProjectId}
                />
                {selectedProjectId && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Using project data to help create your campaign
                  </p>
                )}
              </div>
            )}
            
            <CampaignModeSelection 
              onModeSelect={handleModeSelect}
              selectedMode={selectedMode}
              projectId={selectedProjectId || initialProjectId}
            />
            
            <div className="flex justify-end mt-6">
              <Button 
                onClick={handleContinue}
                disabled={(selectedMode !== "manual") && !selectedProjectId && !initialProjectId}
              >
                Continue
              </Button>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <Tabs value={formTab} onValueChange={(value) => setFormTab(value as "details" | "ads")}>
              <TabsList className="mb-6">
                <TabsTrigger value="details">Campaign Details</TabsTrigger>
                <TabsTrigger value="ads">Select Ads</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details">
                <CreateCampaignForm 
                  projectId={selectedProjectId || initialProjectId || ""} 
                  creationMode={selectedMode}
                  onSuccess={() => {
                    handleClose();
                    if (onSuccess) onSuccess();
                  }}
                  onCancel={handleClose}
                  onBack={handleBack}
                  selectedAdIds={selectedAdIds}
                  onContinue={() => setFormTab("ads")}
                />
              </TabsContent>
              
              <TabsContent value="ads">
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                    <h3 className="text-blue-800 font-medium mb-1">Select Ads for Campaign</h3>
                    <p className="text-blue-600 text-sm">
                      Choose the ads you want to include in your campaign. You can select up to 5 ads.
                    </p>
                  </div>
                  
                  <AdSelectionGallery
                    projectId={selectedProjectId || initialProjectId}
                    onAdsSelected={handleAdsSelected}
                    selectedAdIds={selectedAdIds}
                    maxSelection={5}
                  />
                  
                  <div className="flex items-center justify-between pt-4">
                    <Button variant="outline" onClick={() => setFormTab("details")}>
                      Back to Details
                    </Button>
                    <Button 
                      onClick={() => setFormTab("details")}
                      disabled={selectedAdIds.length === 0}
                    >
                      Continue with {selectedAdIds.length} ad{selectedAdIds.length !== 1 ? 's' : ''}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
