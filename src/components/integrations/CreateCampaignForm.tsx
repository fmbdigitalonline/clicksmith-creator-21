
import { useState, useEffect } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertCircle, Info } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { transformToFacebookAdFormat } from "@/utils/facebookAdTransformer";
import { BusinessIdea, TargetAudience } from "@/types/adWizard";

interface CreateCampaignFormProps {
  projectId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function CreateCampaignForm({ 
  projectId, 
  onSuccess, 
  onCancel 
}: CreateCampaignFormProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    objective: "CONVERSIONS",
    budget: "5",
    startDate: "",
    endDate: "",
    headline: "",
    description: "",
    imageUrl: "",
    callToAction: "LEARN_MORE",
    ageMin: "18",
    ageMax: "65",
    genders: "all",
    countries: "US",
    landingPageUrl: "",
    isAdvancedMode: false,
  });
  const [projectData, setProjectData] = useState<any>(null);
  const [wizardData, setWizardData] = useState<any>(null);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [formTab, setFormTab] = useState("basic");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const session = useSession();
  const { toast } = useToast();

  // Fetch project and wizard data
  useEffect(() => {
    async function fetchData() {
      if (!session || !projectId) return;
      
      try {
        setIsLoadingData(true);
        
        // Fetch project data
        const { data: project, error: projectError } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId)
          .single();

        if (projectError) throw projectError;
        
        // Fetch wizard data
        const { data: wizard, error: wizardError } = await supabase
          .from("wizard_progress")
          .select("business_idea, target_audience, audience_analysis, generated_ads")
          .eq("user_id", session?.user?.id)
          .single();

        if (wizardError && wizardError.code !== 'PGRST116') {
          console.warn("No wizard data found:", wizardError);
        }
        
        setProjectData(project);
        setWizardData(wizard || {});
        
        // Initialize form with project data
        if (project) {
          // Extract business name for campaign name
          const businessName = typeof project.business_idea === 'object' && project.business_idea !== null
            ? project.business_idea.description || ""
            : "";
            
          // Extract image URL from generated ads if available
          let imageUrl = "";
          if (wizard?.generated_ads && Array.isArray(wizard.generated_ads) && wizard.generated_ads.length > 0) {
            imageUrl = wizard.generated_ads[0].imageUrl || "";
          }
          
          // Create a landing page URL
          const landingPageUrl = `https://${window.location.hostname}/share/${projectId}`;
          
          setFormData(prev => ({
            ...prev,
            name: `${businessName.substring(0, 30)} Campaign`,
            headline: businessName.substring(0, 40),
            description: typeof project.business_idea === 'object' && project.business_idea !== null 
              ? project.business_idea.valueProposition || "" 
              : "",
            imageUrl,
            landingPageUrl
          }));
        }
      } catch (error) {
        console.error("Error fetching project data:", error);
        toast({
          title: "Error",
          description: "Failed to load project data",
          variant: "destructive",
        });
      } finally {
        setIsLoadingData(false);
      }
    }

    fetchData();
  }, [session, projectId, toast]);

  // Handle form change
  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error when field is changed
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formData.name.trim()) errors.name = "Campaign name is required";
    if (!formData.budget || isNaN(Number(formData.budget)) || Number(formData.budget) < 1) {
      errors.budget = "Valid budget is required (min $1)";
    }
    if (!formData.headline.trim()) errors.headline = "Ad headline is required";
    if (!formData.description.trim()) errors.description = "Ad description is required";
    if (!formData.landingPageUrl.trim()) errors.landingPageUrl = "Landing page URL is required";
    
    // If we're in advanced mode, validate those fields too
    if (formData.isAdvancedMode) {
      if (!formData.startDate) errors.startDate = "Start date is required";
      if (formData.startDate && formData.endDate && new Date(formData.endDate) <= new Date(formData.startDate)) {
        errors.endDate = "End date must be after start date";
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle create campaign
  const handleCreateCampaign = async () => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to create a campaign",
        variant: "destructive",
      });
      return;
    }
    
    // Validate form
    if (!validateForm()) {
      toast({
        title: "Form Error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsCreating(true);
      setError(null);
      
      // Prepare business idea from project or wizard data
      let businessIdea: BusinessIdea = {
        description: "",
        valueProposition: ""
      };
      
      // Try to get business idea from wizard data first, then fall back to project data
      if (wizardData?.business_idea && typeof wizardData.business_idea === 'object') {
        businessIdea = wizardData.business_idea as BusinessIdea;
      } else if (projectData?.business_idea && typeof projectData.business_idea === 'object') {
        businessIdea = projectData.business_idea as BusinessIdea;
      } else {
        // Create a basic business idea from form data
        businessIdea = {
          description: formData.headline,
          valueProposition: formData.description
        };
      }
      
      // Prepare target audience
      let targetAudience: TargetAudience = {
        name: "Target Audience",
        description: "",
        demographics: `${formData.ageMin}-${formData.ageMax}, ${formData.genders === 'all' ? 'men and women' : formData.genders} in ${formData.countries}`,
        painPoints: [],
        icp: "",
        coreMessage: "",
        positioning: "",
        marketingAngle: "",
        messagingApproach: "",
        marketingChannels: []
      };
      
      // Try to get target audience from wizard data, then fall back to project data
      if (wizardData?.target_audience && typeof wizardData.target_audience === 'object') {
        targetAudience = wizardData.target_audience as TargetAudience;
      } else if (projectData?.target_audience && typeof projectData.target_audience === 'object') {
        targetAudience = projectData.target_audience as TargetAudience;
      }
      
      // Create ad variant
      const adVariant = {
        headline: formData.headline,
        description: formData.description,
        imageUrl: formData.imageUrl,
        callToAction: formData.callToAction
      };
      
      // Transform to Facebook-compatible format
      const facebookAdData = transformToFacebookAdFormat(
        businessIdea,
        targetAudience,
        adVariant,
        Number(formData.budget),
        formData.landingPageUrl
      );
      
      // Add form-specific data
      facebookAdData.campaign.name = formData.name;
      facebookAdData.campaign.objective = formData.objective as string;
      
      // Add scheduling if in advanced mode
      if (formData.isAdvancedMode && formData.startDate) {
        facebookAdData.adSet.start_time = new Date(formData.startDate).toISOString();
        
        if (formData.endDate) {
          facebookAdData.adSet.end_time = new Date(formData.endDate).toISOString();
        }
      }
      
      // Log what we're sending
      console.log("Sending Facebook ad data:", facebookAdData);
      
      // Call the Edge Function to create the campaign
      const response = await supabase.functions.invoke("create-facebook-campaign", {
        body: {
          campaignData: facebookAdData.campaign,
          adSetData: facebookAdData.adSet,
          adCreativeData: facebookAdData.adCreative,
          projectId
        }
      });

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to create campaign");
      }

      // Success!
      toast({
        title: "Success!",
        description: "Facebook campaign created successfully",
      });
      
      if (onSuccess) {
        onSuccess();
      }
      
    } catch (error) {
      console.error("Error creating campaign:", error);
      setError(error.message || "Failed to create campaign");
      
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs value={formTab} onValueChange={setFormTab} className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="basic" className="flex-1">Basic Settings</TabsTrigger>
          <TabsTrigger value="creative" className="flex-1">Ad Creative</TabsTrigger>
          <TabsTrigger value="targeting" className="flex-1">Targeting</TabsTrigger>
        </TabsList>
        
        {/* Basic Settings Tab */}
        <TabsContent value="basic" className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Campaign Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter campaign name"
              className={validationErrors.name ? "border-red-500" : ""}
            />
            {validationErrors.name && (
              <p className="text-sm text-red-500">{validationErrors.name}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="objective">Campaign Objective</Label>
            <Select 
              value={formData.objective} 
              onValueChange={(value) => handleChange('objective', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select objective" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CONVERSIONS">Conversions</SelectItem>
                <SelectItem value="TRAFFIC">Traffic</SelectItem>
                <SelectItem value="REACH">Reach</SelectItem>
                <SelectItem value="BRAND_AWARENESS">Brand Awareness</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="budget">Daily Budget ($)</Label>
            <Input
              id="budget"
              value={formData.budget}
              onChange={(e) => handleChange('budget', e.target.value)}
              type="number"
              min="1"
              step="1"
              className={validationErrors.budget ? "border-red-500" : ""}
            />
            {validationErrors.budget && (
              <p className="text-sm text-red-500">{validationErrors.budget}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2 pt-2">
            <Switch
              checked={formData.isAdvancedMode}
              onCheckedChange={(checked) => handleChange('isAdvancedMode', checked)}
            />
            <Label htmlFor="advanced-mode">Advanced Mode</Label>
          </div>
          
          {formData.isAdvancedMode && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleChange('startDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={validationErrors.startDate ? "border-red-500" : ""}
                  />
                  {validationErrors.startDate && (
                    <p className="text-sm text-red-500">{validationErrors.startDate}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleChange('endDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className={validationErrors.endDate ? "border-red-500" : ""}
                  />
                  {validationErrors.endDate && (
                    <p className="text-sm text-red-500">{validationErrors.endDate}</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </TabsContent>
        
        {/* Creative Tab */}
        <TabsContent value="creative" className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="headline">Ad Headline</Label>
            <Input
              id="headline"
              value={formData.headline}
              onChange={(e) => handleChange('headline', e.target.value)}
              placeholder="Enter headline (max 40 characters)"
              maxLength={40}
              className={validationErrors.headline ? "border-red-500" : ""}
            />
            {validationErrors.headline && (
              <p className="text-sm text-red-500">{validationErrors.headline}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.headline.length}/40 characters
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Ad Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Enter description (max 125 characters)"
              maxLength={125}
              className={validationErrors.description ? "border-red-500" : ""}
            />
            {validationErrors.description && (
              <p className="text-sm text-red-500">{validationErrors.description}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formData.description.length}/125 characters
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="imageUrl">Image URL</Label>
            <Input
              id="imageUrl"
              value={formData.imageUrl}
              onChange={(e) => handleChange('imageUrl', e.target.value)}
              placeholder="Enter image URL"
            />
            <p className="text-xs text-muted-foreground">
              Enter a direct URL to your image (1200×628px recommended)
            </p>
          </div>
          
          {formData.imageUrl && (
            <div className="mt-4">
              <Label>Image Preview</Label>
              <div className="mt-2 border rounded-md overflow-hidden max-h-[200px]">
                <img 
                  src={formData.imageUrl} 
                  alt="Ad Preview" 
                  className="w-full h-auto object-contain"
                  onError={(e) => {
                    e.currentTarget.src = 'https://placehold.co/1200x628/e2e8f0/64748b?text=Image+Not+Found';
                  }}
                />
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="callToAction">Call to Action</Label>
            <Select 
              value={formData.callToAction} 
              onValueChange={(value) => handleChange('callToAction', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select CTA" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LEARN_MORE">Learn More</SelectItem>
                <SelectItem value="SIGN_UP">Sign Up</SelectItem>
                <SelectItem value="SHOP_NOW">Shop Now</SelectItem>
                <SelectItem value="BOOK_TRAVEL">Book Now</SelectItem>
                <SelectItem value="DOWNLOAD">Download</SelectItem>
                <SelectItem value="GET_OFFER">Get Offer</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="landingPageUrl">Landing Page URL</Label>
            <Input
              id="landingPageUrl"
              value={formData.landingPageUrl}
              onChange={(e) => handleChange('landingPageUrl', e.target.value)}
              placeholder="Enter landing page URL"
              className={validationErrors.landingPageUrl ? "border-red-500" : ""}
            />
            {validationErrors.landingPageUrl && (
              <p className="text-sm text-red-500">{validationErrors.landingPageUrl}</p>
            )}
          </div>
        </TabsContent>
        
        {/* Targeting Tab */}
        <TabsContent value="targeting" className="space-y-4 py-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>About Targeting</AlertTitle>
            <AlertDescription>
              We've pre-filled targeting based on your audience information. You can customize it below.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ageMin">Minimum Age</Label>
              <Select 
                value={formData.ageMin} 
                onValueChange={(value) => handleChange('ageMin', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Min Age" />
                </SelectTrigger>
                <SelectContent>
                  {[13, 18, 21, 25, 30, 35, 40, 45, 50, 55, 60, 65].map(age => (
                    <SelectItem key={age} value={age.toString()}>{age}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ageMax">Maximum Age</Label>
              <Select 
                value={formData.ageMax} 
                onValueChange={(value) => handleChange('ageMax', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Max Age" />
                </SelectTrigger>
                <SelectContent>
                  {[18, 21, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, "65+"].map(age => (
                    <SelectItem key={age} value={age.toString()}>{age}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="genders">Gender</Label>
            <Select 
              value={formData.genders} 
              onValueChange={(value) => handleChange('genders', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="men">Men</SelectItem>
                <SelectItem value="women">Women</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="countries">Countries</Label>
            <Select 
              value={formData.countries} 
              onValueChange={(value) => handleChange('countries', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="US">United States</SelectItem>
                <SelectItem value="CA">Canada</SelectItem>
                <SelectItem value="GB">United Kingdom</SelectItem>
                <SelectItem value="AU">Australia</SelectItem>
                <SelectItem value="US,CA">US and Canada</SelectItem>
                <SelectItem value="US,CA,GB,AU">English Speaking Countries</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="pt-4">
            <Alert variant="outline">
              <AlertDescription className="text-sm">
                Detailed targeting (interests, behaviors) will be generated based on your audience data and campaign objective.
              </AlertDescription>
            </Alert>
          </div>
        </TabsContent>
      </Tabs>
      
      <Separator />
      
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onCancel} disabled={isCreating}>
          Cancel
        </Button>
        <Button onClick={handleCreateCampaign} disabled={isCreating}>
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Campaign...
            </>
          ) : (
            'Create Campaign'
          )}
        </Button>
      </div>
    </div>
  );
}
