
import { useState } from "react";
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
  const [formSubmitFn, setFormSubmitFn] = useState<(() => void) | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formIsValid, setFormIsValid] = useState(false);
  
  // Fetch project data for targeting suggestions and validation
  const projectData = useProjectCampaignData(selectedProjectId || initialProjectId);
  
  // Extract targeting data if available
  const targetingData = projectData.targetAudience ? 
    extractTargetingData(projectData.targetAudience, projectData.audienceAnalysis) : null;

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
    // Prevent multiple clicks by checking if already processing
    if (isSubmitting) return;
    
    // Only allow non-manual modes if a project is selected
    if ((selectedMode === "semi-automatic" || selectedMode === "automatic") && !selectedProjectId) {
      return;
    }
    
    setIsSubmitting(true);
    
    // Add a small delay to prevent double triggers
    setTimeout(() => {
      setStep("form");
      setIsSubmitting(false);
    }, 100);
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
      setFormSubmitFn(null);
      setIsSubmitting(false);
      setFormIsValid(false);
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

  // Handle form validation status
  const handleFormValidation = (isValid: boolean) => {
    setFormIsValid(isValid);
  };

  // Set the form submit function from the child component
  const handleFormSubmitReady = (submitFn: () => void) => {
    setFormSubmitFn(submitFn);
  };

  // Add a new function to handle navigation to ads tab
  const handleContinueToAds = () => {
    setFormTab("ads");
  };

  // Add a new function to handle form submission directly
  const handleFormSubmit = () => {
    // Prevent multiple submissions
    if (isSubmitting) return;
    
    console.log("Submitting campaign with selected ads:", selectedAdIds);
    setIsSubmitting(true);
    
    if (formSubmitFn) {
      // Call the form's submit function directly
      formSubmitFn();
      
      // Reset the isSubmitting flag after a reasonable timeout
      // in case the submission callback doesn't fire
      setTimeout(() => {
        setIsSubmitting(false);
      }, 5000);
    } else {
      console.error("Form submit function not available");
      setIsSubmitting(false);
    }
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
                disabled={(selectedMode !== "manual") && !selectedProjectId && !initialProjectId || isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Continue"}
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
                  onContinue={handleContinueToAds}
                  projectDataCompleteness={projectData.dataCompleteness}
                  onFormSubmitReady={handleFormSubmitReady}
                  onFormValidation={handleFormValidation}
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
                      disabled={selectedAdIds.length === 0 || !formSubmitFn || isSubmitting || !formIsValid}
                      variant="facebook"
                    >
                      {isSubmitting ? "Creating..." : `Create Campaign with ${selectedAdIds.length} ad${selectedAdIds.length !== 1 ? 's' : ''}`}
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
