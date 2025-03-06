
import { useState, useEffect } from "react";
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
import { Loader2 } from "lucide-react";
import { useProjectCampaignData } from "@/hooks/useProjectCampaignData";
import { 
  generateCampaignName, 
  generateCampaignDescription, 
  suggestDailyBudget,
  generateDefaultDates
} from "@/utils/campaignDataUtils";

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
  onSuccess?: () => void;
  onCancel?: () => void;
  onBack?: () => void;
  selectedAdIds?: string[];
  onContinue?: () => void;
}

export default function CreateCampaignForm({ 
  projectId, 
  creationMode, 
  onSuccess, 
  onCancel,
  onBack,
  selectedAdIds = [],
  onContinue
}: CreateCampaignFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const projectData = useProjectCampaignData(projectId);
  
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
  });
  
  // Update form values when project data loads
  useEffect(() => {
    if (!projectData.loading && projectData.businessIdea) {
      const defaults = getDefaultValues();
      
      Object.entries(defaults).forEach(([field, value]) => {
        form.setValue(field as any, value);
      });
    }
  }, [projectData.loading, projectData.businessIdea]);
  
  const handleFormSubmit = async (values: z.infer<typeof campaignFormSchema>) => {
    try {
      setIsSubmitting(true);

      // Extract targeting data for Facebook API
      const targetingData = projectData.targetAudience ? {
        targeting: projectData.targetAudience,
        analysis: projectData.audienceAnalysis
      } : undefined;

      // Include selected ad IDs and extracted targeting
      const campaignData = {
        ...values,
        selected_ad_ids: selectedAdIds,
        targeting_data: targetingData,
        smart_targeting: creationMode !== "manual"
      };
      
      console.log("Form submitted with values:", campaignData);
      
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Smart data integration notification */}
        {projectData.businessIdea && creationMode !== "manual" && (
          <div className="p-4 bg-blue-50 border border-blue-100 rounded-md mb-6">
            <h3 className="text-blue-800 font-medium">Smart Data Integration Active</h3>
            <p className="text-blue-700 text-sm">
              Campaign details have been pre-filled based on your project data.
            </p>
          </div>
        )}
        
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
              <FormLabel>Objective</FormLabel>
              <FormControl>
                <Input placeholder="Increase brand awareness" {...field} />
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
              <FormLabel>Target Audience</FormLabel>
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
              <FormLabel>Budget</FormLabel>
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
                onClick={onContinue}
                disabled={!form.formState.isValid}
              >
                Continue to Ad Selection
              </Button>
            ) : (
              <Button 
                type="submit" 
                disabled={isSubmitting}
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
