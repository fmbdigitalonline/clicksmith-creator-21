
import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, BrainCircuit, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { callFacebookCampaignManager } from "@/utils/campaignDataUtils";
import { CampaignFormForwardRef, CampaignFormValues } from "@/types/campaignTypes";

const campaignFormSchema = z.object({
  name: z.string().min(3, "Campaign name must be at least 3 characters"),
  objective: z.enum([
    "OUTCOME_AWARENESS", 
    "OUTCOME_TRAFFIC", 
    "OUTCOME_ENGAGEMENT", 
    "OUTCOME_SALES", 
    "OUTCOME_LEADS", 
    "OUTCOME_APP_PROMOTION"
  ]),
  budget: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(5, "Minimum budget is $5").max(1000, "Maximum budget is $1000")
  ),
  bid_amount: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z.number().min(0, "Bid amount must be positive").optional()
  ),
  bid_strategy: z.enum([
    "LOWEST_COST_WITHOUT_CAP",
    "LOWEST_COST_WITH_BID_CAP",
    "COST_CAP"
  ]).default("LOWEST_COST_WITHOUT_CAP"),
  end_date: z.date().optional().nullable(),
  start_date: z.date().default(() => new Date()),
  targeting: z.object({
    age_min: z.number().min(13).max(65).default(18),
    age_max: z.number().min(13).max(65).default(65),
    gender: z.enum(["ALL", "MALE", "FEMALE"]).default("ALL"),
    interests: z.array(z.string()).optional(),
    locations: z.array(z.string()).optional(),
  }).optional(),
  additional_notes: z.string().optional(),
});

interface CreateCampaignFormProps {
  projectId?: string;
  creationMode: "manual" | "semi-automatic" | "automatic";
  selectedAdIds: string[];
  onSuccess: (campaignId: string) => void;
  onCancel: () => void;
  onContinue: () => void;
  onBack: () => void;
  projectDataCompleteness?: number;
  targetingData?: any;
  formRef?: React.MutableRefObject<CampaignFormForwardRef | null>;
}

const CreateCampaignForm = forwardRef<CampaignFormForwardRef, CreateCampaignFormProps>((
  { 
    projectId,
    creationMode,
    selectedAdIds,
    onSuccess,
    onCancel,
    onContinue,
    onBack,
    projectDataCompleteness = 0,
    targetingData,
    formRef
  }, 
  ref
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectTitle, setProjectTitle] = useState<string>("");
  const { toast } = useToast();
  
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      name: "",
      objective: "OUTCOME_AWARENESS",
      budget: 50,
      bid_amount: 0,
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
      start_date: new Date(),
      end_date: null,
      targeting: {
        age_min: 18,
        age_max: 65,
        gender: "ALL",
        interests: [],
        locations: [],
      },
      additional_notes: "",
    },
    mode: "onSubmit",
    reValidateMode: "onChange"
  });

  // Add a validate form function that ensures validation happens without submission
  const validateForm = async (): Promise<boolean> => {
    console.log("Validating form...");
    const result = await form.trigger();
    console.log("Form validation result:", result);
    console.log("Current form errors:", form.formState.errors);
    return result;
  };

  // Create a clean submitForm function that handles validation and submission
  const submitForm = async (): Promise<boolean> => {
    console.log("submitForm called");
    try {
      const isValid = await validateForm();
      
      if (!isValid) {
        console.log("Form validation failed, stopping submission");
        toast({
          title: "Validation Error",
          description: "Please fix the form errors before submitting",
          variant: "destructive"
        });
        return false;
      }
      
      if (!projectId) {
        console.log("No project ID provided");
        toast({
          title: "Project Required",
          description: "Please select a project for this campaign",
          variant: "destructive"
        });
        return false;
      }
      
      // If we're just validating the form, return true without submitting
      if (selectedAdIds.length === 0) {
        return true; // Form is valid but we're not submitting yet
      }
      
      // Get form values and proceed with actual submission
      const values = form.getValues();
      return await handleFormSubmit(values);
    } catch (error) {
      console.error("Error in submitForm:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive"
      });
      return false;
    }
  };

  // Improved use of useImperativeHandle to ensure form ref works correctly
  useImperativeHandle(ref, () => ({
    submitForm
  }), [form, projectId, toast, selectedAdIds]);

  // Updated useEffect to ensure formRef is properly set
  useEffect(() => {
    if (formRef) {
      console.log("Setting form ref in CreateCampaignForm");
      formRef.current = {
        submitForm
      };
    }
  }, [formRef, form, toast, projectId, selectedAdIds]);

  useEffect(() => {
    const fetchProjectTitle = async () => {
      if (projectId && projectId !== 'new') {
        try {
          console.log('Fetching project title for projectId:', projectId);
          const { data, error } = await supabase
            .from('projects')
            .select('title')
            .eq('id', projectId)
            .single();
            
          if (error) {
            console.error('Error fetching project title:', error);
            throw error;
          }
          
          if (data?.title) {
            console.log('Project title found:', data.title);
            setProjectTitle(data.title);
            
            const campaignName = `${data.title} Campaign`;
            console.log('Setting campaign name to:', campaignName);
            form.setValue('name', campaignName);
          }
        } catch (error) {
          console.error('Error fetching project title:', error);
        }
      }
    };
    
    fetchProjectTitle();
  }, [projectId, form]);

  useEffect(() => {
    if (targetingData && (creationMode === "semi-automatic" || creationMode === "automatic")) {
      console.log("Setting form targeting data from project:", targetingData);
      
      form.setValue("targeting", {
        age_min: targetingData.age_min || 18,
        age_max: targetingData.age_max || 65,
        gender: targetingData.gender || "ALL",
        interests: targetingData.interests || [],
        locations: targetingData.locations || [],
      });
    }
  }, [targetingData, creationMode, form]);

  const handleFormSubmit = async (values: CampaignFormValues) => {
    console.log("Form values to submit:", values);
    
    if (selectedAdIds.length === 0) {
      console.log("No ads selected, redirecting to ad selection tab");
      onContinue();
      return false;
    }
    
    if (!projectId) {
      toast({
        title: "Project required",
        description: "Please select a project for this campaign",
        variant: "destructive",
      });
      return false;
    }

    setIsSubmitting(true);
    
    try {
      const adDetails = await loadAdDataForIds(selectedAdIds);
      console.log("Loaded ad details:", adDetails);
      
      if (adDetails.length === 0) {
        throw new Error("Could not load details for the selected ads");
      }
      
      const campaignData = {
        ...values,
        project_id: projectId,
        ads: selectedAdIds,
        ad_details: adDetails,
        creation_mode: creationMode,
        type: "facebook",
        status: "draft",
      };
      
      console.log("Submitting campaign data:", campaignData);

      const { data, error } = await callFacebookCampaignManager('create_campaign', { campaign_data: campaignData });

      if (error) {
        console.error("Function error:", error);
        toast({
          title: "Campaign Creation Failed",
          description: error.message || "There was an error creating your campaign",
          variant: "destructive",
        });
        return false;
      }

      if (!data || !data.campaign_id) {
        throw new Error("Invalid response from campaign manager function");
      }

      console.log("Campaign created successfully:", data);
      toast({
        title: "Campaign Created",
        description: "Your campaign has been created successfully",
      });

      onSuccess(data.campaign_id);
      return true;
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create campaign",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadAdDataForIds = async (adIds: string[]): Promise<any[]> => {
    if (!adIds.length) return [];
    
    try {
      const { data: adFeedbackData, error: adFeedbackError } = await supabase
        .from('ad_feedback')
        .select('id, headline, primary_text, imageUrl, imageurl, size, platform, fb_ad_settings, storage_url')
        .in('id', adIds);
      
      if (adFeedbackError) throw adFeedbackError;
      
      if (adFeedbackData && adFeedbackData.length > 0) {
        return adFeedbackData.map(ad => ({
          id: ad.id,
          headline: ad.headline,
          primary_text: ad.primary_text,
          imageUrl: ad.storage_url || ad.imageUrl || ad.imageurl,
          size: ad.size,
          platform: ad.platform || 'facebook',
          fb_ad_settings: ad.fb_ad_settings
        }));
      }
      
      if (projectId) {
        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('generated_ads')
          .eq('id', projectId)
          .single();
        
        if (projectError) throw projectError;
        
        if (project?.generated_ads && Array.isArray(project.generated_ads)) {
          const matchingAds = project.generated_ads.filter((ad: any) => 
            adIds.includes(ad.id)
          );
          
          return matchingAds.map((ad: any) => ({
            id: ad.id,
            headline: ad.headline,
            primary_text: ad.primary_text,
            imageUrl: ad.imageUrl || ad.imageurl,
            size: ad.size,
            platform: ad.platform || 'facebook',
            fb_ad_settings: ad.fb_ad_settings
          }));
        }
      }
      
      return [];
    } catch (error) {
      console.error("Error loading ad data:", error);
      return [];
    }
  };

  const shouldShowBidAmount = form.watch('bid_strategy') !== 'LOWEST_COST_WITHOUT_CAP';

  const handleContinueClick = async () => {
    try {
      const isValid = await validateForm();
      
      if (isValid) {
        onContinue();
      } else {
        toast({
          title: "Please complete all required fields",
          description: "Fix the form errors before continuing to ad selection",
          variant: "destructive"
        });
        const errorFields = Object.keys(form.formState.errors);
        if (errorFields.length > 0) {
          form.setFocus(errorFields[0] as keyof CampaignFormValues);
        }
      }
    } catch (error) {
      console.error("Error validating form:", error);
      toast({
        title: "Validation Error",
        description: "There was a problem validating the form",
        variant: "destructive"
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={(e) => { e.preventDefault(); submitForm(); }} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Campaign Name</FormLabel>
                <FormControl>
                  <Input placeholder="Campaign Name" {...field} />
                </FormControl>
                <FormDescription>
                  {projectTitle && "Auto-filled with your project name. Feel free to customize."}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="objective"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Campaign Objective</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an objective" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="OUTCOME_AWARENESS">Brand Awareness</SelectItem>
                    <SelectItem value="OUTCOME_TRAFFIC">Website Traffic</SelectItem>
                    <SelectItem value="OUTCOME_ENGAGEMENT">Engagement</SelectItem>
                    <SelectItem value="OUTCOME_SALES">Conversions</SelectItem>
                    <SelectItem value="OUTCOME_LEADS">Lead Generation</SelectItem>
                    <SelectItem value="OUTCOME_APP_PROMOTION">App Promotion</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  What do you want to achieve with this campaign?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Daily Budget (USD)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="number" min="5" max="1000" placeholder="50" className="pl-8" {...field} />
                  </div>
                </FormControl>
                <FormDescription>
                  How much do you want to spend per day? (Min: $5, Max: $1000)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bid_strategy"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bid Strategy</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a bid strategy" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="LOWEST_COST_WITHOUT_CAP">Lowest Cost (Automatic)</SelectItem>
                    <SelectItem value="LOWEST_COST_WITH_BID_CAP">Lowest Cost with Bid Cap</SelectItem>
                    <SelectItem value="COST_CAP">Cost Cap</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  How Facebook should optimize your ad delivery and bidding
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {shouldShowBidAmount && (
            <FormField
              control={form.control}
              name="bid_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bid Amount (USD)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input type="number" min="0.1" step="0.1" placeholder="2.00" className="pl-8" {...field} />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Maximum amount you're willing to bid (required for your selected bid strategy)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Start Date</FormLabel>
                  <DatePicker
                    date={field.value}
                    setDate={(newDate) => field.onChange(newDate)}
                    className="w-full"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>End Date (Optional)</FormLabel>
                  <DatePicker
                    date={field.value}
                    setDate={(newDate) => field.onChange(newDate)}
                    className="w-full"
                    placeholder="Leave empty for continuous campaign"
                  />
                  <FormDescription>
                    Leave empty for continuous campaign
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {creationMode === "manual" && (
          <div className="space-y-4 border p-4 rounded-md bg-slate-50">
            <h3 className="text-lg font-medium flex items-center">
              <Target className="h-5 w-5 mr-2 text-slate-500" />
              Targeting Options
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="targeting.age_min"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Age</FormLabel>
                    <FormControl>
                      <Input type="number" min="13" max="65" {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="targeting.age_max"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Age</FormLabel>
                    <FormControl>
                      <Input type="number" min="13" max="65" {...field}
                        onChange={e => field.onChange(parseInt(e.target.value))} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="targeting.gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ALL">All Genders</SelectItem>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        )}

        {creationMode !== "manual" && (
          <div className="border p-4 rounded-md bg-blue-50">
            <h3 className="text-lg font-medium flex items-center text-blue-800">
              <BrainCircuit className="h-5 w-5 mr-2 text-blue-600" />
              AI-Powered Targeting
            </h3>
            <p className="text-sm text-blue-700 mt-2">
              {creationMode === "automatic" 
                ? "Full automatic targeting is enabled based on your project data. Our AI will optimize your audience for maximum results."
                : "Semi-automatic targeting is enabled. We've pre-filled targeting options based on your project data."}
            </p>
            
            {targetingData && (
              <div className="mt-4 p-3 bg-white rounded border border-blue-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
                  <div className="text-sm">
                    <span className="font-medium text-slate-700">Age Range:</span>{" "}
                    <span className="text-slate-800">{targetingData.age_min}-{targetingData.age_max}</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-slate-700">Gender:</span>{" "}
                    <span className="text-slate-800">{targetingData.gender === "ALL" ? "All Genders" : targetingData.gender === "MALE" ? "Male" : "Female"}</span>
                  </div>
                  <div className="text-sm col-span-1 sm:col-span-2 mt-1">
                    <span className="font-medium text-slate-700">Interests:</span>{" "}
                    <span className="text-slate-800">{targetingData.interests?.slice(0, 3).join(", ")}{targetingData.interests?.length > 3 ? ` and ${targetingData.interests.length - 3} more...` : ""}</span>
                  </div>
                </div>
              </div>
            )}
            
            {!targetingData && (
              <div className="mt-4 p-3 bg-white rounded border border-yellow-200 text-yellow-800">
                <div className="flex items-center">
                  <span>No targeting data available from your project. Consider providing more details in your project or switch to manual targeting.</span>
                </div>
              </div>
            )}
          </div>
        )}

        <FormField
          control={form.control}
          name="additional_notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Additional Notes</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Any additional information about this campaign..." 
                  className="min-h-[80px]"
                  {...field} 
                />
              </FormControl>
              <FormDescription>
                Optional notes for internal reference
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between pt-4 border-t">
          <div className="flex gap-2">
            <Button type="button" onClick={onBack} variant="outline">
              Back
            </Button>
            <Button type="button" onClick={onCancel} variant="ghost">
              Cancel
            </Button>
          </div>
          
          <Button 
            type="button" 
            onClick={handleContinueClick}
            disabled={isSubmitting}
          >
            Continue to Ad Selection
          </Button>
        </div>
      </form>
    </Form>
  );
});

CreateCampaignForm.displayName = "CreateCampaignForm";

export default CreateCampaignForm;
