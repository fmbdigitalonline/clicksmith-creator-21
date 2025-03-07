
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CreateCampaignForm from "@/components/integrations/CreateCampaignForm";
import CampaignModeSelection from "@/components/integrations/CampaignModeSelection";
import { Button } from "@/components/ui/button";
import { ProjectSelector } from "@/components/gallery/components/ProjectSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdSelectionGallery from "@/components/integrations/AdSelectionGallery";
import { AlertCircle, Info, CheckCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { extractTargetingData } from "@/utils/campaignDataUtils";
import { useProjectCampaignData } from "@/hooks/useProjectCampaignData";
import DataCompletionWarning from "@/components/projects/DataCompletionWarning";
import CampaignStatusCard from "@/components/integrations/CampaignStatusCard";
import { useToast } from "@/hooks/use-toast";

interface FacebookCampaignFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
  onSuccess?: () => void;
  // Add the missing props
  campaignToEdit?: any; // Using 'any' for now, ideally should use a proper type
  isEditing?: boolean;
}

export default function FacebookCampaignForm({ 
  open, 
  onOpenChange, 
  projectId: initialProjectId,
  onSuccess,
  campaignToEdit,
  isEditing = false
}: FacebookCampaignFormProps) {
  const [step, setStep] = useState<"mode-selection" | "form" | "status">(isEditing ? "form" : "mode-selection");
  const [selectedMode, setSelectedMode] = useState<"manual" | "semi-automatic" | "automatic">("manual");
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || "");
  const [formTab, setFormTab] = useState<"details" | "ads">("details");
  const [selectedAdIds, setSelectedAdIds] = useState<string[]>([]);
  const [createdCampaignId, setCreatedCampaignId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const campaignFormRef = useRef<{ submitForm: () => Promise<boolean> } | null>(null);
  
  // Fetch project data for targeting suggestions and validation
  const projectData = useProjectCampaignData(selectedProjectId || initialProjectId);
  
  // Extract targeting data if available
  const targetingData = projectData.targetAudience ? 
    extractTargetingData(projectData.targetAudience, projectData.audienceAnalysis) : null;

  // Initialize state from campaignToEdit when in editing mode
  useEffect(() => {
    if (isEditing && campaignToEdit) {
      // Set the project ID if available in the campaign
      if (campaignToEdit.project_id) {
        setSelectedProjectId(campaignToEdit.project_id);
      }
      
      // Set the creation mode if available
      if (campaignToEdit.creation_mode) {
        setSelectedMode(campaignToEdit.creation_mode as "manual" | "semi-automatic" | "automatic");
      }
      
      // If campaign has ads, initialize selectedAdIds
      if (campaignToEdit.campaign_data?.ads) {
        const adIds = campaignToEdit.campaign_data.ads.map((ad: any) => ad.id).filter(Boolean);
        setSelectedAdIds(adIds);
      }
    }
  }, [isEditing, campaignToEdit]);

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
    if (step === "form") {
      setStep("mode-selection");
    } else if (step === "status") {
      setStep("form");
      setCreatedCampaignId("");
    }
  };

  const handleClose = () => {
    // Reset state when dialog is closed
    setTimeout(() => {
      setStep(isEditing ? "form" : "mode-selection");
      if (!initialProjectId) {
        setSelectedProjectId("");
      }
      setSelectedMode("manual");
      setFormTab("details");
      setSelectedAdIds([]);
      setCreatedCampaignId("");
      setIsSubmitting(false);
    }, 300); // Small delay to avoid seeing the reset during close animation
    onOpenChange(false);
  };

  const handleAdsSelected = (adIds: string[]) => {
    setSelectedAdIds(adIds);
  };

  const handleCampaignCreated = (campaignId: string) => {
    console.log("Campaign created with ID:", campaignId);
    setCreatedCampaignId(campaignId);
    setStep("status");
    setIsSubmitting(false);
    
    // Call onSuccess if provided
    if (onSuccess) {
      onSuccess();
    }
  };

  const handleCampaignActivated = () => {
    console.log("Campaign activated!");
    if (onSuccess) {
      onSuccess();
    }
  };

  // Function to handle form submission directly
  const handleFormSubmit = async () => {
    if (isSubmitting) {
      console.log("Already submitting, ignoring duplicate submission");
      return;
    }
    
    if (selectedAdIds.length === 0) {
      toast({
        title: "No ads selected",
        description: "Please select at least one ad for your campaign",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log("Submitting campaign with selected ads:", selectedAdIds);
      
      // Use the ref to call the submitForm method directly
      if (campaignFormRef.current && typeof campaignFormRef.current.submitForm === 'function') {
        const result = await campaignFormRef.current.submitForm();
        console.log("Form submission result:", result);
        if (!result) {
          // If the form submission fails, reset the submitting state
          setIsSubmitting(false);
          toast({
            title: "Form validation failed",
            description: "Please check all form fields and try again",
            variant: "destructive"
          });
        }
      } else {
        console.error("Campaign form ref or submitForm method not found");
        setIsSubmitting(false);
        toast({
          title: "Error",
          description: "Failed to submit campaign. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create campaign",
        variant: "destructive"
      });
    }
  };

  // Validate if user can proceed to ad selection
  const canContinueToAds = () => {
    return formTab === "details" && selectedProjectId;
  };

  // Validate if form is ready for submission
  const canSubmitCampaign = () => {
    return selectedAdIds.length > 0 && !isSubmitting;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Facebook Campaign" : "Create Facebook Campaign"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update your Facebook ad campaign" : "Create a new Facebook ad campaign for your project"}
          </DialogDescription>
        </DialogHeader>
        
        {step === "mode-selection" && (
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
            
            {/* Show data validation warning if project is selected */}
            {(selectedProjectId || initialProjectId) && !projectData.loading && (
              <DataCompletionWarning 
                validation={projectData.validation}
                completenessPercentage={projectData.dataCompleteness}
                showDetails={true}
              />
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
        )}
        
        {step === "form" && (
          <div className="space-y-6">
            {/* Show compact validation warning before tabs in form mode */}
            {(selectedProjectId || initialProjectId) && !projectData.loading && !projectData.validation.isComplete && (
              <DataCompletionWarning 
                validation={projectData.validation}
                completenessPercentage={projectData.dataCompleteness}
                showDetails={false}
              />
            )}
            
            <Tabs value={formTab} onValueChange={(value) => setFormTab(value as "details" | "ads")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="details">Campaign Details</TabsTrigger>
                <TabsTrigger value="ads">Creative Selection</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details">
                {targetingData && selectedMode !== "manual" && (
                  <Alert className="mb-6 bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">Smart Targeting Active</AlertTitle>
                    <AlertDescription className="text-blue-700">
                      {`Using ${selectedMode === "automatic" ? "automated" : "assisted"} targeting with age range ${targetingData.age_min}-${targetingData.age_max} and ${targetingData.interests.length} interest categories.`}
                    </AlertDescription>
                  </Alert>
                )}
                
                <CreateCampaignForm 
                  projectId={selectedProjectId || initialProjectId || ""} 
                  creationMode={selectedMode}
                  onSuccess={handleCampaignCreated}
                  onCancel={handleClose}
                  onBack={handleBack}
                  selectedAdIds={selectedAdIds}
                  campaignToEdit={campaignToEdit}
                  isEditing={isEditing}
                  onContinue={() => {
                    if (canContinueToAds()) {
                      setFormTab("ads");
                    } else {
                      toast({
                        title: "Please complete all required fields",
                        description: "Make sure you've filled in all the campaign details before continuing.",
                        variant: "destructive"
                      });
                    }
                  }}
                  projectDataCompleteness={projectData.dataCompleteness}
                  formRef={campaignFormRef}
                />
              </TabsContent>
              
              <TabsContent value="ads">
                <div className="space-y-6">
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertCircle className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">Creative Selection</AlertTitle>
                    <AlertDescription className="text-blue-700">
                      Choose the ads you want to include in your campaign. You can select up to 5 creatives to test in your campaign.
                    </AlertDescription>
                  </Alert>
                  
                  <AdSelectionGallery
                    projectId={selectedProjectId || initialProjectId}
                    onAdsSelected={handleAdsSelected}
                    selectedAdIds={selectedAdIds}
                    maxSelection={5}
                  />
                  
                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button variant="outline" onClick={() => setFormTab("details")}>
                      Back to Campaign Details
                    </Button>
                    <Button 
                      onClick={handleFormSubmit}
                      disabled={!canSubmitCampaign()}
                      variant="facebook"
                    >
                      {isSubmitting ? "Creating Campaign..." : isEditing 
                        ? `Update Campaign with ${selectedAdIds.length} ad${selectedAdIds.length !== 1 ? 's' : ''}`
                        : `Create Campaign with ${selectedAdIds.length} ad${selectedAdIds.length !== 1 ? 's' : ''}`
                      }
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        {step === "status" && createdCampaignId && (
          <div className="space-y-6">
            <Alert className="bg-green-50 border-green-200 mb-6">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Campaign Created Successfully</AlertTitle>
              <AlertDescription className="text-green-700">
                Your campaign has been created and is ready to be activated.
              </AlertDescription>
            </Alert>
            
            <CampaignStatusCard 
              campaignId={createdCampaignId}
              onActivate={handleCampaignActivated}
            />
            
            <div className="flex justify-end mt-4">
              <Button onClick={handleClose} variant="outline">
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
