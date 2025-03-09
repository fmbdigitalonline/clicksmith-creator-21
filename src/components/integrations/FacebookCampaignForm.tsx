
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CreateCampaignForm from "@/components/integrations/CreateCampaignForm";
import CampaignModeSelection from "@/components/integrations/CampaignModeSelection";
import { Button } from "@/components/ui/button";
import { ProjectSelector } from "@/components/gallery/components/ProjectSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdSelectionGallery from "@/components/integrations/AdSelectionGallery";
import { AlertCircle, Info, CheckCircle, LayoutDashboard } from "lucide-react";
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
}

export default function FacebookCampaignForm({ 
  open, 
  onOpenChange, 
  projectId: initialProjectId,
  onSuccess
}: FacebookCampaignFormProps) {
  const [step, setStep] = useState<"mode-selection" | "form" | "status">("mode-selection");
  const [selectedMode, setSelectedMode] = useState<"manual" | "semi-automatic" | "automatic">("manual");
  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || "");
  const [formTab, setFormTab] = useState<"details" | "ads">("details");
  const [selectedAdIds, setSelectedAdIds] = useState<string[]>([]);
  const [createdCampaignId, setCreatedCampaignId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [initialProjectSet, setInitialProjectSet] = useState<boolean>(false);
  const { toast } = useToast();
  const campaignFormRef = useRef<{ submitForm: () => Promise<boolean> } | null>(null);
  
  // Fetch project data for targeting suggestions and validation
  const projectData = useProjectCampaignData(selectedProjectId);

  // Log any changes to selectedProjectId
  useEffect(() => {
    console.log("Selected project ID changed in FacebookCampaignForm:", selectedProjectId);
    // Clear project error when a project is selected
    if (selectedProjectId) {
      setProjectError(null);
    }
  }, [selectedProjectId]);

  // This useEffect ensures the project ID is properly set from props once, but allows it to be changed by user
  useEffect(() => {
    if (initialProjectId && !selectedProjectId && !initialProjectSet) {
      console.log("Setting initial project ID:", initialProjectId);
      setSelectedProjectId(initialProjectId);
      setInitialProjectSet(true);
      setProjectError(null);
    }
  }, [initialProjectId, selectedProjectId, initialProjectSet]);
  
  // Extract targeting data if available
  const targetingData = projectData.targetAudience ? 
    extractTargetingData(projectData.targetAudience, projectData.audienceAnalysis) : null;

  const handleModeSelect = (mode: "manual" | "semi-automatic" | "automatic") => {
    setSelectedMode(mode);
  };

  const handleProjectSelect = (projectId: string) => {
    console.log("Project selected in Facebook form:", projectId);
    
    // Make sure we properly update the state
    setSelectedProjectId(projectId);
    
    // Clear project error when a project is selected
    setProjectError(null);
    
    // If they select a project and were in a disabled mode, switch to semi-automatic
    if (selectedMode !== "manual" && !selectedProjectId) {
      setSelectedMode("semi-automatic");
    }
  };

  const validateProjectSelection = (): boolean => {
    // For non-manual modes, a project is required
    if ((selectedMode === "semi-automatic" || selectedMode === "automatic") && !selectedProjectId) {
      setProjectError("A project is required for semi-automatic or automatic mode");
      return false;
    }
    
    return true;
  };

  const handleContinue = () => {
    // Check project selection
    if (!validateProjectSelection()) {
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
      setStep("mode-selection");
      if (!initialProjectId) {
        setSelectedProjectId("");
      }
      setSelectedMode("manual");
      setFormTab("details");
      setSelectedAdIds([]);
      setCreatedCampaignId("");
      setIsSubmitting(false);
      setProjectError(null);
      setInitialProjectSet(false);
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
        // Debug the targeting data and selected ads before submission
        console.log("Targeting data before submission:", targetingData);
        console.log("Selected ads before submission:", selectedAdIds);
        
        const result = await campaignFormRef.current.submitForm();
        console.log("Form submission result:", result);
        
        if (!result) {
          // If the form submission fails, reset the submitting state
          setIsSubmitting(false);
          toast({
            title: "Campaign creation failed",
            description: "There was an error creating your campaign. Please check your form values and try again.",
            variant: "destructive"
          });
        }
      } else {
        console.error("Campaign form ref or submitForm method not found");
        setIsSubmitting(false);
        toast({
          title: "Internal Error",
          description: "Could not access the campaign form. Please try again or refresh the page.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create campaign. Please check the console for details.",
        variant: "destructive"
      });
    }
  };

  // Validate if user can proceed to ad selection
  const canContinueToAds = () => {
    // Make sure we have a project selected before continuing
    if (!selectedProjectId) {
      setProjectError("Please select a project before continuing");
      return false;
    }
    return formTab === "details";
  };

  // Validate if form is ready for submission
  const canSubmitCampaign = () => {
    return selectedAdIds.length > 0 && !isSubmitting;
  };

  // Log state for debugging
  console.log("Form state:", {
    open,
    step,
    selectedMode,
    selectedProjectId,
    initialProjectId,
    formTab,
    selectedAdIds,
    projectDataLoaded: !!projectData,
    projectError
  });

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Facebook Campaign</DialogTitle>
          <DialogDescription>
            Create a new Facebook ad campaign for your project
          </DialogDescription>
        </DialogHeader>
        
        {/* Mode selection step */}
        {step === "mode-selection" && (
          <>
            <div className="mb-6 bg-white p-4 rounded-lg border border-slate-200">
              <h3 className="text-lg font-medium mb-3 flex items-center text-slate-800">
                <LayoutDashboard className="h-5 w-5 mr-2 text-slate-500" />
                Select Project
              </h3>
              <ProjectSelector 
                onSelect={handleProjectSelect}
                selectedProjectId={selectedProjectId}
                required={selectedMode !== "manual"}
                errorMessage={projectError || "A project is required for this campaign mode"}
              />
              
              {selectedProjectId && !projectError && (
                <div className="flex items-center mt-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <p>Project successfully selected</p>
                </div>
              )}
            </div>
            
            {(selectedProjectId) && !projectData.loading && (
              <DataCompletionWarning 
                validation={projectData.validation}
                completenessPercentage={projectData.dataCompleteness}
                showDetails={true}
              />
            )}
            
            <CampaignModeSelection 
              onModeSelect={handleModeSelect}
              selectedMode={selectedMode}
              projectId={selectedProjectId}
            />
            
            <div className="flex justify-end mt-6">
              <Button 
                onClick={handleContinue}
                disabled={(selectedMode !== "manual") && !selectedProjectId}
              >
                Continue
              </Button>
            </div>
          </>
        )}
        
        {/* Form step */}
        {step === "form" && (
          <div className="space-y-6">
            {/* Show project selector at the top if not already selected */}
            {!selectedProjectId && (
              <div className="mb-6 relative" style={{ zIndex: 90 }}>
                <h3 className="text-lg font-medium mb-2">Select Project</h3>
                <ProjectSelector 
                  onSelect={handleProjectSelect}
                  selectedProjectId={selectedProjectId}
                  required={true}
                  errorMessage="A project is required to create a campaign"
                />
              </div>
            )}
            
            {(selectedProjectId) && !projectData.loading && !projectData.validation.isComplete && (
              <DataCompletionWarning 
                validation={projectData.validation}
                completenessPercentage={projectData.dataCompleteness}
                showDetails={false}
              />
            )}
            
            <Tabs value={formTab} onValueChange={(value) => setFormTab(value as "details" | "ads")} className="relative z-10">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="details">Campaign Details</TabsTrigger>
                <TabsTrigger value="ads" disabled={!selectedProjectId}>Creative Selection</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details">
                {!selectedProjectId && (
                  <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Project Required</AlertTitle>
                    <AlertDescription>
                      Please select a project before continuing with campaign creation.
                    </AlertDescription>
                  </Alert>
                )}
                
                {targetingData && selectedMode !== "manual" && selectedProjectId && (
                  <Alert className="mb-6 bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">Smart Targeting Active</AlertTitle>
                    <AlertDescription className="text-blue-700">
                      {`Using ${selectedMode === "automatic" ? "automated" : "assisted"} targeting with age range ${targetingData.age_min}-${targetingData.age_max} and ${targetingData.interests.length} interest categories.`}
                    </AlertDescription>
                  </Alert>
                )}
                
                <CreateCampaignForm 
                  projectId={selectedProjectId} 
                  creationMode={selectedMode}
                  onSuccess={handleCampaignCreated}
                  onCancel={handleClose}
                  onBack={handleBack}
                  selectedAdIds={selectedAdIds}
                  onContinue={() => {
                    if (canContinueToAds()) {
                      setFormTab("ads");
                    } else {
                      if (!selectedProjectId) {
                        setProjectError("Please select a project before continuing");
                        toast({
                          title: "Project Required",
                          description: "You must select a project before proceeding to ad selection.",
                          variant: "destructive"
                        });
                      } else {
                        toast({
                          title: "Please complete all required fields",
                          description: "Make sure you've filled in all the campaign details before continuing.",
                          variant: "destructive"
                        });
                      }
                    }
                  }}
                  projectDataCompleteness={projectData.dataCompleteness}
                  targetingData={targetingData}  // Pass targeting data explicitly
                  formRef={campaignFormRef}
                />
              </TabsContent>
              
              <TabsContent value="ads">
                {!selectedProjectId ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Project Required</AlertTitle>
                    <AlertDescription>
                      Please go back and select a project before selecting ads.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-6">
                    <Alert className="bg-blue-50 border-blue-200">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertTitle>Creative Selection</AlertTitle>
                      <AlertDescription>
                        Choose the ads you want to include in your campaign. You can select up to 5 creatives to test in your campaign.
                      </AlertDescription>
                    </Alert>
                    
                    <AdSelectionGallery
                      projectId={selectedProjectId}
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
                        {isSubmitting ? "Creating Campaign..." : `Create Campaign with ${selectedAdIds.length} ad${selectedAdIds.length !== 1 ? 's' : ''}`}
                      </Button>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
        
        {/* Status step */}
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
