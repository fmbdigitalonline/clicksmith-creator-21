
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { CalendarIcon, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/components/ui/use-toast";

// Form schema definition
const formSchema = z.object({
  name: z.string().min(2, "Campaign name must be at least 2 characters."),
  status: z.string().default("pending"),
  project_id: z.string().uuid(),
  platform: z.literal("facebook"),
  objective: z.string(),
  special_ad_categories: z.string().default("NONE"),
  budget: z.coerce.number().min(1, "Budget must be at least 1."),
  start_date: z.date(),
  end_date: z.date().optional(),
  headline: z.string().min(1, "Headline is required"),
  primary_text: z.string().min(1, "Ad text is required"),
  description: z.string().optional(),
  website_url: z.string().url("Please enter a valid URL"),
  call_to_action: z.string(),
  image_url: z.string().url("Please enter a valid image URL")
});

type FormData = z.infer<typeof formSchema>;

// Define types for project data to prevent TypeScript errors
interface BusinessIdea {
  website?: string;
  [key: string]: any;
}

interface Hook {
  title?: string;
  description?: string;
  [key: string]: any;
}

interface ProjectData {
  title: string;
  business_idea?: BusinessIdea;
  selected_hooks?: Hook[];
  [key: string]: any;
}

interface CreateCampaignFormProps {
  projectId: string;
  creationMode?: "manual" | "semi-automatic" | "automatic"; // New prop
  onSuccess?: () => void;
  onCancel?: () => void;
  onBack?: () => void; // New prop for navigation
}

export default function CreateCampaignForm({ 
  projectId, 
  creationMode = "manual", // Default to manual if not provided
  onSuccess, 
  onCancel, 
  onBack 
}: CreateCampaignFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const { toast } = useToast();

  // Setup form with default values
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      status: "pending",
      project_id: projectId,
      platform: "facebook",
      objective: "CONVERSIONS",
      special_ad_categories: "NONE",
      budget: 5,
      start_date: new Date(),
      headline: "",
      primary_text: "",
      description: "",
      website_url: "",
      call_to_action: "LEARN_MORE",
      image_url: ""
    }
  });

  // Fetch project data for semi-automatic and automatic modes
  useEffect(() => {
    if (creationMode !== "manual" && projectId) {
      const fetchProjectData = async () => {
        try {
          const { data, error } = await supabase
            .from("projects")
            .select("*")
            .eq("id", projectId)
            .single();

          if (error) throw error;
          setProjectData(data as ProjectData);

          // Pre-fill form based on project data for semi-automatic mode
          if (creationMode === "semi-automatic" && data) {
            // Set campaign name based on project title
            form.setValue("name", `${data.title} Campaign`);
            
            // If we have business_idea with a website
            if (data.business_idea && typeof data.business_idea === 'object' && 'website' in data.business_idea) {
              form.setValue("website_url", data.business_idea.website as string);
            }
            
            // If we have generated ad copy from hooks
            if (data.selected_hooks && Array.isArray(data.selected_hooks) && data.selected_hooks.length > 0) {
              const hook = data.selected_hooks[0];
              if (hook.title) form.setValue("headline", hook.title);
              if (hook.description) form.setValue("primary_text", hook.description);
            }
            
            // If we have saved ad images
            const fetchSavedAds = async () => {
              const { data: adData } = await supabase
                .from("ad_feedback")
                .select("imageUrl")
                .eq("project_id", projectId)
                .order("created_at", { ascending: false })
                .limit(1);
                
              if (adData && adData.length > 0 && adData[0].imageUrl) {
                form.setValue("image_url", adData[0].imageUrl);
              }
            };
            
            fetchSavedAds();
          }
          
          // For automatic mode, we'll just load the data and use it later
          // when the form is submitted
        } catch (error) {
          console.error("Error fetching project data:", error);
        }
      };

      fetchProjectData();
    }
  }, [creationMode, projectId, form]);

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // For automatic mode, we'll generate campaign data using AI
      if (creationMode === "automatic" && projectData) {
        toast({
          title: "AI Campaign Creation",
          description: "Your campaign is being created automatically. This may take a moment...",
        });
        
        // This would call an AI function to generate the campaign
        // For now, we'll simulate with preset values
        data.headline = `${projectData.title} - Special Offer`;
        data.primary_text = `Discover the best solution for your needs with ${projectData.title}. Limited time offer!`;
        data.call_to_action = "SHOP_NOW";
      }
      
      // Add creation mode to the campaign data
      const campaignData = {
        ...data,
        // Convert dates to ISO string format for storage in Supabase
        start_date: data.start_date.toISOString(),
        end_date: data.end_date ? data.end_date.toISOString() : null,
        creation_mode: creationMode,
        // Include any AI suggestions that were used
        ai_suggestions_used: creationMode === "automatic" ? {
          headline: true,
          primary_text: true,
          call_to_action: true
        } : {}
      };
      
      // Submit to Supabase
      const { data: campaign, error } = await supabase
        .from("ad_campaigns")
        .insert(campaignData)
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Campaign created",
        description: "Your campaign has been created successfully and is being processed.",
      });
      
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error("Error creating campaign:", error);
      setError("Failed to create campaign. Please try again.");
      toast({
        title: "Error",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {onBack && (
        <Button 
          variant="ghost" 
          onClick={onBack} 
          className="mb-4 px-0"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Mode Selection
        </Button>
      )}
      
      {creationMode !== "manual" && (
        <Alert className="bg-blue-50 border-blue-200 mb-6">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800">
            {creationMode === "semi-automatic" 
              ? "Semi-Automatic Mode" 
              : "AI-Driven Campaign Creation"}
          </AlertTitle>
          <AlertDescription className="text-blue-700">
            {creationMode === "semi-automatic"
              ? "We've pre-filled some fields based on your project data. Feel free to adjust as needed."
              : "Our AI will optimize your campaign based on your project data. Review the settings before creating."}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Campaign Details Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Campaign Details</h3>
            
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campaign Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter campaign name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <FormField
                control={form.control}
                name="objective"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campaign Objective</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select objective" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="AWARENESS">Brand Awareness</SelectItem>
                        <SelectItem value="TRAFFIC">Traffic</SelectItem>
                        <SelectItem value="ENGAGEMENT">Engagement</SelectItem>
                        <SelectItem value="LEADS">Lead Generation</SelectItem>
                        <SelectItem value="CONVERSIONS">Conversions</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <Input type="number" min="1" step="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`w-full pl-3 text-left font-normal ${
                              !field.value ? "text-muted-foreground" : ""
                            }`}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
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
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={`w-full pl-3 text-left font-normal ${
                              !field.value ? "text-muted-foreground" : ""
                            }`}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={(date) => 
                            date < new Date() || 
                            (form.getValues("start_date") && date < form.getValues("start_date"))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Ad Creative Section */}
          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-medium">Ad Creative</h3>
            
            <FormField
              control={form.control}
              name="headline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Headline</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter ad headline" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="primary_text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ad Text</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter your ad text" 
                      className="min-h-[100px]" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter a short description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <FormField
                control={form.control}
                name="website_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="call_to_action"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Call to Action</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select CTA" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="LEARN_MORE">Learn More</SelectItem>
                        <SelectItem value="SHOP_NOW">Shop Now</SelectItem>
                        <SelectItem value="SIGN_UP">Sign Up</SelectItem>
                        <SelectItem value="BOOK_TRAVEL">Book Now</SelectItem>
                        <SelectItem value="DOWNLOAD">Download</SelectItem>
                        <SelectItem value="SUBSCRIBE">Subscribe</SelectItem>
                        <SelectItem value="CONTACT_US">Contact Us</SelectItem>
                        <SelectItem value="APPLY_NOW">Apply Now</SelectItem>
                        <SelectItem value="GET_QUOTE">Get Quote</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter image URL" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Image preview - Fixed the ReactNode error by using a proper conditional render */}
            {form.watch("image_url") && (
              <div className="mt-2 rounded-md overflow-hidden border">
                <img 
                  src={form.watch("image_url")} 
                  alt="Ad preview" 
                  className="max-h-[200px] object-contain mx-auto"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {creationMode === "automatic" 
                ? "Generate & Create Campaign" 
                : "Create Campaign"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
