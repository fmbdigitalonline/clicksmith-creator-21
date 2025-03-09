
import { useState, useEffect, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle } from "lucide-react";
import { useProjectCampaignData } from "@/hooks/useProjectCampaignData";
import { 
  generateCampaignName, 
  generateCampaignDescription, 
  suggestDailyBudget,
  generateDefaultDates,
  extractTargetingData
} from "@/utils/campaignDataUtils";
import { AISuggestion } from "./AISuggestion";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const campaignFormSchema = z.object({
  name: z.string().min(2, {
    message: "Campaign name must be at least 2 characters.",
  }),
  objective: z.string().min(2, {
    message: "Objective must be at least 2 characters.",
  }),
  targetAudience: z.string().min(10, {
    message: "Target audience description must be at least 10 characters.",
  }),
  budget: z.string().regex(/^\d+$/, {
    message: "Budget must be a number.",
  }),
  startDate: z.string().min(1, {
    message: "Start date is required.",
  }),
  endDate: z.string().min(1, {
    message: "End date is required.",
  }),
  creativeBrief: z.string().min(20, {
    message: "Creative brief must be at least 20 characters.",
  }),
});

interface CreateCampaignFormProps {
  projectId?: string;
  creationMode: "manual" | "semi-automatic" | "automatic";
  onSuccess?: (campaignId: string) => void;
  onCancel?: () => void;
  onBack?: () => void;
  selectedAdIds?: string[];
  onContinue?: () => void;
  projectDataCompleteness?: number;
  formRef?: React.MutableRefObject<{ submitForm: () => Promise<boolean> } | null>;
}

export default function CreateCampaignForm({ 
  projectId, 
  creationMode, 
  onSuccess, 
  onCancel,
  onBack,
  selectedAdIds = [],
  onContinue,
  projectDataCompleteness = 100,
  formRef
}: CreateCampaignFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPerformancePrediction, setShowPerformancePrediction] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const projectData = useProjectCampaignData(projectId);
  const { toast } = useToast();
  
  // Generate default values based on project data
  const getDefaultValues = () => {
    const dates = generateDefaultDates();
    const defaultTargetAudience = projectData.targetAudience?.description || 
                                "People interested in our products and services";
    
    return {
      name: generateCampaignName(projectData.businessIdea),
      objective: "REACH",
      targetAudience: defaultTargetAudience,
      budget: suggestDailyBudget().toString(),
      startDate: dates.startDate,
      endDate: dates.endDate,
      creativeBrief: generateCampaignDescription(projectData.businessIdea),
    };
  };

  const form = useForm<z.infer<typeof campaignFormSchema>>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: getDefaultValues(),
    mode: "onChange",
  });
  
  // Clear validation errors when projectId changes
  useEffect(() => {
    setValidationErrors([]);
  }, [projectId]);
  
  // Update form values when project data loads
  useEffect(() => {
    if (!projectData.loading && projectData.businessIdea) {
      const defaults = getDefaultValues();
      
      Object.entries(defaults).forEach(([field, value]) => {
        form.setValue(field as any, value, { 
          shouldValidate: true,
          shouldDirty: true 
        });
      });
    }
  }, [projectData.loading, projectData.businessIdea]);
  
  // Add a useEffect to log form state for debugging
  useEffect(() => {
    const subscription = form.watch(() => {
      console.log("Form values:", form.getValues());
      console.log("Form errors:", form.formState.errors);
      console.log("Form is valid:", form.formState.isValid);
    });
    
    return () => subscription.unsubscribe();
  }, [form]);
  
  const handleFormSubmit = async (values: z.infer<typeof campaignFormSchema>) => {
    if (isSubmitting) {
      console.log("Already submitting, ignoring duplicate submission");
      return false;
    }
    
    // Check if project is selected
    if (!projectId) {
      setValidationErrors(["Please select a project before submitting"]);
      toast({
        title: "Project Required",
        description: "You must select a project before creating a campaign",
        variant: "destructive"
      });
      return false;
    }
    
    if (selectedAdIds.length === 0) {
      toast({
        title: "No ads selected",
        description: "Please select at least one ad for your campaign",
        variant: "destructive"
      });
      return false;
    }

    try {
      setIsSubmitting(true);
      setValidationErrors([]);

      // Extract and properly format targeting data from project data
      let targetingData = null;
      if (projectData.targetAudience) {
        targetingData = extractTargetingData(projectData.targetAudience, projectData.audienceAnalysis);
      }

      // Include selected ad IDs and properly formatted targeting data
      const campaignData = {
        ...values,
        selected_ad_ids: selectedAdIds,
        targeting_data: targetingData || undefined,
        smart_targeting: creationMode !== "manual"
      };
      
      console.log("Submitting campaign with data:", campaignData);
      
      // Create the campaign record in the database using the campaign manager
      const response = await supabase.functions.invoke('facebook-campaign-manager', {
        body: {
          operation: 'create',
          campaignData: { 
            name: values.name,
            objective: values.objective,
            status: "PAUSED" 
          },
          adSetData: {
            name: `${values.name} - Ad Set`,
            daily_budget: parseInt(values.budget),
            targeting: targetingData
          },
          adCreativeData: {
            name: `${values.name} - Creative`,
            object_story_spec: {
              page_id: '{{page_id}}', // Will be replaced by the function
              link_data: {
                message: values.creativeBrief,
                link: "https://your-landing-page.com",
                name: values.name,
                call_to_action: { type: "LEARN_MORE" }
              }
            }
          },
          projectId,
          campaignMode: creationMode,
          selectedAdIds
        }
      });
      
      if (response.error) {
        console.error("Edge function error:", response.error);
        throw new Error(response.error.message || "Error creating campaign");
      }
      
      const campaignRecord = response.data;
      
      toast({
        title: "Campaign created",
        description: "Your campaign has been created successfully.",
      });
      
      // Call onSuccess with the campaign ID
      if (onSuccess && campaignRecord) {
        onSuccess(campaignRecord.campaignRecordId);
      }
      
      return true;
    } catch (error) {
      console.error("Form submission error:", error);
      setIsSubmitting(false);
      toast({
        title: "Error creating campaign",
        description: error instanceof Error ? error.message : "There was an error creating your campaign. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Expose the submission function directly
  const submitForm = async () => {
    console.log("submitForm called, checking form validity");
    try {
      // Check if project is selected
      if (!projectId) {
        setValidationErrors(["Please select a project before submitting"]);
        toast({
          title: "Project Required",
          description: "You must select a project before creating a campaign",
          variant: "destructive"
        });
        return false;
      }
      
      // Run validation on all fields and get current values
      const isValid = await form.trigger();
      console.log("Form validation result:", isValid);
      console.log("Current errors:", form.formState.errors);
      
      if (isValid) {
        console.log("Form is valid, submitting values");
        const values = form.getValues();
        const result = await handleFormSubmit(values);
        return result;
      } else {
        // Provide more detailed error feedback
        const errorFields = Object.keys(form.formState.errors);
        console.log("Validation failed for fields:", errorFields);
        
        setValidationErrors(errorFields.map(field => {
          const error = form.formState.errors[field as keyof typeof form.formState.errors];
          return error?.message?.toString() || `${field} is invalid`;
        }));
        
        toast({
          title: "Validation Error",
          description: `Please complete the following fields: ${errorFields.join(", ")}`,
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error("Error in submitForm:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return false;
    }
  };

  // Expose the submitForm method via ref
  useEffect(() => {
    if (formRef && 'current' in formRef) {
      formRef.current = {
        submitForm
      };
    }
  }, [formRef, selectedAdIds, projectId]);

  // Show appropriate messaging based on data completeness
  const renderDataCompletenessMessage = () => {
    if (!projectDataCompleteness || projectDataCompleteness === 100) return null;
    
    if (projectDataCompleteness < 50) {
      return (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-md mb-6">
          <h3 className="text-amber-800 font-medium">Limited Data Available</h3>
          <p className="text-amber-700 text-sm">
            Your campaign might have limited effectiveness due to incomplete project data. Consider adding more information to your project.
          </p>
        </div>
      );
    } else if (projectDataCompleteness < 80) {
      return (
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-md mb-6">
          <h3 className="text-blue-800 font-medium">Additional Data May Help</h3>
          <p className="text-blue-700 text-sm">
            Your campaign could be more effective with additional project data, but the essentials are present.
          </p>
        </div>
      );
    }
  
    return null;
  };

  const handleApplySuggestion = (field: keyof z.infer<typeof campaignFormSchema>, suggestion: string) => {
    form.setValue(field, suggestion, { 
      shouldValidate: true,
      shouldDirty: true 
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Project Required Warning */}
        {!projectId && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please select a project before creating a campaign. This is required to proceed.
            </AlertDescription>
          </Alert>
        )}
        
        {/* Validation errors display */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-semibold">Please fix the following errors:</div>
              <ul className="list-disc pl-4 mt-1 text-sm">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
        
        {/* Smart data integration notification */}
        {projectData.businessIdea && creationMode !== "manual" && (
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-md mb-6">
            <h3 className="text-blue-800 font-medium">Smart Data Integration Active</h3>
            <p className="text-blue-700 text-sm">
              Campaign details have been pre-filled based on your project data.
            </p>
          </div>
        )}
        
        {/* Show data completeness message */}
        {renderDataCompletenessMessage()}
        
        {/* Form fields */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Campaign Name</FormLabel>
              <FormControl>
                <Input placeholder="My Awesome Campaign" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="objective"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center">
                <FormLabel>Objective</FormLabel>
                <AISuggestion 
                  type="objective"
                  size="sm"
                  businessIdea={projectData.businessIdea}
                  targetAudience={projectData.targetAudience}
                  onSuggestionSelected={(suggestion) => handleApplySuggestion("objective", suggestion)}
                  disabled={projectData.loading}
                />
              </div>
              <FormControl>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.trigger("objective"); // Validate after selection
                  }}
                  defaultValue={field.value}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select campaign objective" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="REACH">Reach</SelectItem>
                    <SelectItem value="TRAFFIC">Traffic</SelectItem>
                    <SelectItem value="ENGAGEMENT">Engagement</SelectItem>
                    <SelectItem value="LEADS">Lead Generation</SelectItem>
                    <SelectItem value="CONVERSIONS">Conversions</SelectItem>
                    <SelectItem value="SALES">Sales</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="targetAudience"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center">
                <FormLabel>Target Audience</FormLabel>
                <AISuggestion 
                  type="targeting"
                  size="sm"
                  businessIdea={projectData.businessIdea}
                  targetAudience={projectData.targetAudience}
                  audienceAnalysis={projectData.audienceAnalysis}
                  onSuggestionSelected={(suggestion) => handleApplySuggestion("targetAudience", suggestion)}
                  disabled={projectData.loading}
                />
              </div>
              <FormControl>
                <Textarea
                  placeholder="Describe your ideal customer"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="budget"
          render={({ field }) => (
            <FormItem>
              <div className="flex justify-between items-center">
                <FormLabel>Budget</FormLabel>
                <AISuggestion 
                  type="budget"
                  size="sm"
                  businessIdea={projectData.businessIdea}
                  targetAudience={projectData.targetAudience}
                  currentValue={field.value}
                  onSuggestionSelected={(suggestion) => handleApplySuggestion("budget", suggestion)}
                  disabled={projectData.loading}
                />
              </div>
              <FormControl>
                <Input placeholder="1000" type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex space-x-2">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="w-1/2">
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="w-1/2">
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="creativeBrief"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Creative Brief</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe the creative direction for your campaign"
                  className="resize-none"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {/* Performance prediction section */}
        <div className="pt-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => setShowPerformancePrediction(!showPerformancePrediction)}
            className="w-full justify-start text-sm"
          >
            {showPerformancePrediction ? "Hide" : "Show"} Performance Prediction
          </Button>
          
          {showPerformancePrediction && (
            <div className="mt-4">
              <AISuggestion 
                type="performance"
                businessIdea={projectData.businessIdea}
                targetAudience={projectData.targetAudience}
                audienceAnalysis={projectData.audienceAnalysis}
                disabled={projectData.loading}
              />
            </div>
          )}
        </div>
        
        <div className="flex justify-between">
          {onBack && (
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
          )}
          <div className="flex gap-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
            {onContinue ? (
              <Button 
                type="button" 
                onClick={() => {
                  console.log("Continue button clicked, validating form...");
                  // Check if project is selected
                  if (!projectId) {
                    setValidationErrors(["Please select a project before continuing"]);
                    toast({
                      title: "Project Required",
                      description: "You must select a project before proceeding",
                      variant: "destructive"
                    });
                    return;
                  }
                  
                  // Clear previous validation errors
                  setValidationErrors([]);
                  
                  // Validate all fields and then continue if valid
                  form.trigger().then(isValid => {
                    console.log("Form validation on continue:", isValid);
                    if (isValid) {
                      onContinue();
                    } else {
                      const errorFields = Object.keys(form.formState.errors);
                      setValidationErrors(errorFields.map(field => {
                        const error = form.formState.errors[field as keyof typeof form.formState.errors];
                        return error?.message?.toString() || `${field} is invalid`;
                      }));
                      
                      toast({
                        title: "Please complete all required fields",
                        description: `Missing or invalid fields: ${errorFields.join(", ")}`,
                        variant: "destructive"
                      });
                    }
                  });
                }}
                disabled={isSubmitting || !projectId}
              >
                Continue to Ad Selection
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={isSubmitting || !projectId}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Campaign"
                )}
              </Button>
            )}
          </div>
        </div>
        
        {/* Display selected ads count */}
        {selectedAdIds.length > 0 && !onContinue && (
          <div className="p-4 bg-green-50 border border-green-100 rounded-md">
            <h3 className="text-green-800 font-medium">Selected Ads</h3>
            <p className="text-green-700 text-sm">
              {selectedAdIds.length} ad{selectedAdIds.length !== 1 ? 's' : ''} selected for this campaign
            </p>
          </div>
        )}
      </form>
    </Form>
  );
}
