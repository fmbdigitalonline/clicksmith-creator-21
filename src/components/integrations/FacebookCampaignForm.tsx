
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CreateCampaignForm from "@/components/integrations/CreateCampaignForm";
import CampaignModeSelection from "@/components/integrations/CampaignModeSelection";
import { Button } from "@/components/ui/button";
import { ProjectSelector } from "@/components/gallery/components/ProjectSelector";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AdSelectionGallery from "@/components/integrations/AdSelectionGallery";
import { AlertCircle, Info, CheckCircle, LayoutDashboard, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { extractTargetingData } from "@/utils/campaignDataUtils";
import { useProjectCampaignData } from "@/hooks/useProjectCampaignData";
import DataCompletionWarning from "@/components/projects/DataCompletionWarning";
import CampaignStatusCard from "@/components/integrations/CampaignStatusCard";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { CampaignFormRef } from "@/types/campaignTypes";

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
  
  // Create form ref with explicit type
  const campaignFormRef = useRef<CampaignFormRef | null>(null);
  
  // Fetch project data for targeting suggestions and validation
  const projectData = useProjectCampaignData(selectedProjectId);

  const [imagesReady, setImagesReady] = useState<boolean>(true);
  const [processingImages, setProcessingImages] = useState<string[]>([]);
  const [imageCheckError, setImageCheckError] = useState<string | null>(null);
  const [isProcessingSelected, setIsProcessingSelected] = useState(false);
  const [formValidated, setFormValidated] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  
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

  // Reset error when tab changes or form is resubmitted
  useEffect(() => {
    setSubmissionError(null);
  }, [formTab, isSubmitting]);

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
      setFormValidated(false);
      setSubmissionError(null);
    }, 300); // Small delay to avoid seeing the reset during close animation
    onOpenChange(false);
  };

  const handleAdsSelected = (adIds: string[]) => {
    setSelectedAdIds(adIds);
    
    // When ads are selected, trigger checking their status
    if (adIds.length > 0) {
      checkImagesStatus(adIds);
    }
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

  const validateFormBeforeSubmit = async (): Promise<boolean> => {
    // If we don't have a form reference, we can't validate
    if (!campaignFormRef.current) {
      toast({
        title: "Error",
        description: "Cannot access form validation. Please refresh and try again.",
        variant: "destructive"
      });
      return false;
    }

    try {
      // This will trigger validation on the form
      const isValid = await campaignFormRef.current.submitForm();
      console.log("Form validation result:", isValid);
      setFormValidated(isValid);
      return isValid;
    } catch (error) {
      console.error("Error validating form:", error);
      return false;
    }
  };

  // Function to handle form submission directly
  const handleFormSubmit = async () => {
    if (isSubmitting) {
      console.log("Already submitting, ignoring duplicate submission");
      return;
    }
    
    setSubmissionError(null);
    
    // Check for selected ads first
    if (selectedAdIds.length === 0) {
      toast({
        title: "No ads selected",
        description: "Please select at least one ad for your campaign",
        variant: "destructive"
      });
      setSubmissionError("Please select at least one ad for your campaign");
      return;
    }
    
    // Add image validation before submission
    if (!imagesReady) {
      toast({
        title: "Images Not Ready",
        description: "Some of your selected images are still being processed for Facebook. Please wait or select different ads.",
        variant: "destructive"
      });
      setSubmissionError("Images not ready for Facebook. Please wait or choose different ads.");
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log("Submitting campaign with selected ads:", selectedAdIds);
      
      // Check if campaignFormRef.current exists BEFORE trying to access submitForm
      if (!campaignFormRef.current) {
        console.error("Campaign form ref is null");
        setIsSubmitting(false);
        toast({
          title: "Internal Error",
          description: "Could not access the campaign form. Please try refreshing the page.",
          variant: "destructive"
        });
        setSubmissionError("Technical error: Could not access the form");
        return;
      }
      
      // Now we know campaignFormRef.current exists
      if (typeof campaignFormRef.current.submitForm !== 'function') {
        console.error("submitForm method not found on campaign form ref");
        setIsSubmitting(false);
        toast({
          title: "Internal Error",
          description: "Could not submit the form. Please try again or refresh the page.",
          variant: "destructive"
        });
        setSubmissionError("Technical error: Could not submit the form");
        return;
      }
      
      // Debug the targeting data and selected ads before submission
      console.log("Targeting data before submission:", targetingData);
      console.log("Selected ads before submission:", selectedAdIds);
      
      // Check if a campaign with the same name already exists
      const { data: existingCampaignData, error: existingCampaignError } = await supabase
        .from('ad_campaigns')
        .select('id, name')
        .eq('name', campaignFormRef.current['_formValues']?.name || '')
        .maybeSingle();
        
      if (existingCampaignError) {
        console.warn("Error checking for existing campaign:", existingCampaignError);
      }
      
      if (existingCampaignData) {
        console.warn("Campaign with same name exists:", existingCampaignData);
        toast({
          title: "Campaign Name Already Exists",
          description: "A campaign with this name already exists. Please choose a different name.",
          variant: "destructive"
        });
        setSubmissionError("A campaign with this name already exists. Please choose a different name.");
        setIsSubmitting(false);
        setFormTab("details");
        return;
      }
      
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
        setSubmissionError("Campaign creation failed. Please check your form values.");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      setIsSubmitting(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create campaign. Please check the console for details.",
        variant: "destructive"
      });
      setSubmissionError(error instanceof Error ? error.message : "Failed to create campaign");
    }
  };

  // Function to ensure form validation is triggered when switching tabs
  const handleSwitchToAdsTab = async () => {
    // Clear any previous errors
    setSubmissionError(null);
    
    // Validate the form first before switching tabs
    const isValid = await validateFormBeforeSubmit();
    
    if (isValid) {
      console.log("Form validated successfully, switching to ads tab");
      setFormTab("ads");
      setFormValidated(true);
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
  };

  // Validate if form is ready for submission
  const canSubmitCampaign = () => {
    return selectedAdIds.length > 0 && !isSubmitting && imagesReady;
  };

  // Function to check image status and process if needed
  const checkImagesStatus = async (adIds = selectedAdIds) => {
    if (!adIds.length) {
      setImagesReady(true);
      setProcessingImages([]);
      setImageCheckError(null);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('ad_feedback')
        .select('id, image_status, storage_url')
        .in('id', adIds);
        
      if (error) throw error;
      
      if (data) {
        const pendingIds = data
          .filter(ad => ad.image_status === 'pending')
          .map(ad => ad.id);
          
        const processingIds = data
          .filter(ad => ad.image_status === 'processing')
          .map(ad => ad.id);
          
        const allProcessingIds = [...pendingIds, ...processingIds];
        
        setProcessingImages(allProcessingIds);
        setImagesReady(allProcessingIds.length === 0);
        
        // If we have pending images that need processing, show a warning with a button
        if (pendingIds.length > 0) {
          setImageCheckError(`${pendingIds.length} image(s) need to be processed for Facebook. Click the "Process Images" button.`);
        } else if (processingIds.length > 0) {
          setImageCheckError(`${processingIds.length} image(s) still processing for Facebook. Please wait.`);
        } else {
          setImageCheckError(null);
        }
        
        return { pendingIds, processingIds };
      }
      
      return { pendingIds: [], processingIds: [] };
    } catch (error) {
      console.error("Error checking image status:", error);
      setImageCheckError("Could not verify image status. Please try again.");
      return { pendingIds: [], processingIds: [] };
    }
  };
  
  // Function to process pending images
  const processSelectedImages = async () => {
    setIsProcessingSelected(true);
    
    try {
      // Check current status
      const { pendingIds } = await checkImagesStatus();
      
      if (pendingIds.length === 0) {
        toast({
          title: "No images to process",
          description: "All selected images are already processed or processing",
        });
        setIsProcessingSelected(false);
        return;
      }
      
      console.log("Processing images:", pendingIds);
      
      // Call the edge function with batch processing
      const { data, error } = await supabase.functions.invoke('migrate-images', {
        body: { adIds: pendingIds }
      });
      
      if (error) {
        console.error("Error invoking migrate-images:", error);
        throw new Error("Failed to start image processing");
      }
      
      console.log("Processing response:", data);
      
      if (data?.processed) {
        toast({
          title: "Image Processing Started",
          description: `Processing ${data.processed.length} images for Facebook. This may take a moment.`,
        });
        
        // Refresh status after a short delay
        setTimeout(() => checkImagesStatus(), 2000);
        
        // Start monitoring status
        const interval = setInterval(async () => {
          const { processingIds } = await checkImagesStatus();
          if (processingIds.length === 0) {
            clearInterval(interval);
          }
        }, 5000);
      }
    } catch (error) {
      console.error("Error processing images:", error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process images for Facebook",
        variant: "destructive"
      });
    } finally {
      setIsProcessingSelected(false);
    }
  };

  // Add a new effect to check if all selected ad images are ready for Facebook
  useEffect(() => {
    if (selectedAdIds.length > 0 && formTab === 'ads') {
      checkImagesStatus();
      
      // Check status periodically if there are processing images
      const interval = setInterval(() => {
        if (processingImages.length > 0) {
          checkImagesStatus();
        }
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [selectedAdIds, formTab]);

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
            
            <Tabs value={formTab} onValueChange={(value) => {
              // Only allow direct tab switching to details, not to ads
              if (value === "details") {
                setFormTab("details");
              } else if (value === "ads" && formValidated) {
                // Only allow switching to ads tab if form is validated
                setFormTab("ads");
              } else {
                // Otherwise trigger validation
                handleSwitchToAdsTab();
              }
            }} className="relative z-10">
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
                  onContinue={handleSwitchToAdsTab}
                  projectDataCompleteness={projectData.dataCompleteness}
                  targetingData={targetingData}
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
                    
                    {/* Now using the warning variant */}
                    {imageCheckError && (
                      <Alert variant="warning" className="flex justify-between items-center">
                        <div className="flex items-start">
                          <AlertCircle className="h-4 w-4 mt-0.5" />
                          <div className="ml-2">
                            <AlertTitle>Image Processing Required</AlertTitle>
                            <AlertDescription>
                              {imageCheckError}
                            </AlertDescription>
                          </div>
                        </div>
                        {imageCheckError.includes("need to be processed") && (
                          <Button
                            onClick={processSelectedImages}
                            disabled={isProcessingSelected}
                            variant="outline"
                            className="ml-4 bg-white"
                          >
                            {isProcessingSelected ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              <>Process Images</>
                            )}
                          </Button>
                        )}
                      </Alert>
                    )}
                    
                    <AdSelectionGallery
                      projectId={selectedProjectId}
                      onAdsSelected={handleAdsSelected}
                      selectedAdIds={selectedAdIds}
                      maxSelection={5}
                    />
                    
                    {submissionError && (
                      <Alert variant="destructive" className="mt-4">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Submission Error</AlertTitle>
                        <AlertDescription>{submissionError}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="flex items-center justify-between pt-4 border-t">
                      <Button variant="outline" onClick={() => setFormTab("details")}>
                        Back to Campaign Details
                      </Button>
                      <Button 
                        onClick={handleFormSubmit}
                        disabled={!canSubmitCampaign()}
                        variant="facebook"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Creating Campaign...
                          </>
                        ) : (
                          `Create Campaign with ${selectedAdIds.length} ad${selectedAdIds.length !== 1 ? 's' : ''}`
                        )}
                      </Button>
                    </div>
                    
                    {!imagesReady && (
                      <div className="text-sm text-amber-600 flex items-center mt-2">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Images are still being processed for Facebook. Campaign creation will be available once processing is complete.
                      </div>
                    )}
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
