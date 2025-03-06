
import { useState, useEffect } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Loader2, AlertCircle, Plus, CheckCircle, Facebook } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { transformToFacebookAdFormat } from "@/utils/facebookAdTransformer";
import { BusinessIdea, TargetAudience } from "@/types/adWizard";
import { Badge } from "@/components/ui/badge";

// Update the Campaign interface to match the database schema and include image_url
interface Campaign {
  id: string;
  name: string;
  status: string;
  platform: string;
  created_at: string;
  platform_campaign_id: string | null;
  image_url?: string | null;
  targeting?: any;
  budget?: number | null;
  end_date?: string | null;
  start_date?: string | null;
  user_id?: string | null;
  project_id?: string | null;
  updated_at?: string | null;
}

export default function FacebookCampaignOverview() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [budget, setBudget] = useState("5");
  const [error, setError] = useState<string | null>(null);
  const session = useSession();
  const { toast } = useToast();

  useEffect(() => {
    if (session) {
      fetchCampaigns();
      fetchProjects();
    }
  }, [session]);

  const fetchCampaigns = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("ad_campaigns")
        .select("*")
        .eq("platform", "facebook")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Map database response to Campaign interface
      const typedCampaigns: Campaign[] = data?.map((campaign: any) => {
        // Extract image URL from either direct image_url field or from targeting JSON
        let imageUrl = campaign.image_url;
        
        // If no direct image_url, try to extract it from the targeting field
        if (!imageUrl && campaign.targeting) {
          const targeting = typeof campaign.targeting === 'string' 
            ? JSON.parse(campaign.targeting) 
            : campaign.targeting;
            
          if (targeting?.adCreative?.object_story_spec?.link_data?.image_url) {
            imageUrl = targeting.adCreative.object_story_spec.link_data.image_url;
          }
        }
        
        return {
          id: campaign.id,
          name: campaign.name || "", 
          status: campaign.status || "",
          platform: campaign.platform,
          created_at: campaign.created_at,
          platform_campaign_id: campaign.platform_campaign_id,
          image_url: imageUrl,
          targeting: campaign.targeting,
          budget: campaign.budget,
          start_date: campaign.start_date,
          end_date: campaign.end_date,
          user_id: campaign.user_id,
          project_id: campaign.project_id,
          updated_at: campaign.updated_at
        };
      }) || [];
      
      setCampaigns(typedCampaigns);
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      setProjects(data || []);
      if (data && data.length > 0) {
        setSelectedProject(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case "pending":
        return { label: "Pending", color: "bg-yellow-100 text-yellow-800" };
      case "campaign_created":
        return { label: "Campaign Created", color: "bg-blue-100 text-blue-800" };
      case "adset_created":
        return { label: "Ad Set Created", color: "bg-blue-100 text-blue-800" };
      case "completed":
        return { label: "Active", color: "bg-green-100 text-green-800" };
      case "error":
        return { label: "Error", color: "bg-red-100 text-red-800" };
      default:
        return { label: status, color: "bg-gray-100 text-gray-800" };
    }
  };

  const handleCreateCampaign = async () => {
    if (!selectedProject) {
      setError("Please select a project");
      return;
    }

    if (!budget || isNaN(Number(budget)) || Number(budget) < 1) {
      setError("Please enter a valid budget (minimum $1)");
      return;
    }

    try {
      setIsCreating(true);
      setError(null);
      
      // Get project data
      const { data: projectData, error: projectError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", selectedProject)
        .single();

      if (projectError) throw projectError;
      
      if (!projectData) {
        throw new Error("Project not found");
      }

      // Get wizard data
      const { data: wizardData, error: wizardError } = await supabase
        .from("wizard_progress")
        .select("business_idea, target_audience, audience_analysis, generated_ads")
        .eq("user_id", session?.user?.id)
        .single();

      if (wizardError && wizardError.code !== 'PGRST116') {
        throw wizardError;
      }

      if (!wizardData || !wizardData.business_idea || !wizardData.target_audience) {
        throw new Error("No ad data found. Please complete the ad creation wizard first.");
      }

      // Use the transformer to create Facebook-compatible ad data
      const businessIdea = wizardData.business_idea as BusinessIdea;
      const targetAudience = wizardData.target_audience as TargetAudience;
      
      // Get the first ad variant from generated_ads if available
      let adVariant = null;
      if (wizardData.generated_ads && Array.isArray(wizardData.generated_ads) && wizardData.generated_ads.length > 0) {
        adVariant = wizardData.generated_ads[0];
      } else {
        // Create a basic ad variant from business idea
        adVariant = {
          headline: businessIdea.description.substring(0, 40),
          description: businessIdea.valueProposition,
          imageUrl: null
        };
      }

      // Create a landing page URL (placeholder for now)
      const landingPageUrl = `https://${window.location.hostname}/share/${projectData.id}`;
      
      // Get value proposition from business idea and ensure it's a string
      let valueProposition = "";
      
      // Check if business_idea exists and is an object before accessing valueProposition
      if (typeof businessIdea === 'object' && businessIdea !== null && 'valueProposition' in businessIdea) {
        valueProposition = businessIdea.valueProposition as string;
      } else if (typeof projectData.business_idea === 'object' && 
                projectData.business_idea !== null && 
                'valueProposition' in projectData.business_idea) {
        // Fallback to project data if wizard data doesn't have it
        valueProposition = projectData.business_idea.valueProposition as string;
      }
      
      // Create a safe business idea object with required fields
      const safeBussinessIdea: BusinessIdea = {
        ...businessIdea,
        valueProposition: valueProposition || businessIdea.description || "Check out our product"
      };
      
      // Transform the data into Facebook ad format
      const facebookAdData = transformToFacebookAdFormat(
        safeBussinessIdea,
        targetAudience,
        adVariant,
        Number(budget),
        landingPageUrl
      );

      // Now call the Edge Function to create the campaign
      const response = await supabase.functions.invoke("create-facebook-campaign", {
        body: {
          campaignData: facebookAdData.campaign,
          adSetData: facebookAdData.adSet,
          adCreativeData: facebookAdData.adCreative,
          projectId: selectedProject
        }
      });

      if (response.error) {
        throw new Error(response.error);
      }

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to create campaign");
      }

      // Success! Refresh campaigns and close dialog
      toast({
        title: "Success!",
        description: "Facebook campaign created successfully",
      });
      
      setShowDialog(false);
      fetchCampaigns();
      
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

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Facebook Campaigns</CardTitle>
            <CardDescription>
              Create and manage your Facebook ad campaigns
            </CardDescription>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Create Campaign
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Facebook Campaign</DialogTitle>
                <DialogDescription>
                  Create a new campaign from one of your projects
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="project">Select Project</Label>
                  <Select 
                    value={selectedProject} 
                    onValueChange={setSelectedProject}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="budget">Daily Budget ($)</Label>
                  <Input
                    id="budget"
                    placeholder="5"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    type="number"
                    min="1"
                    step="1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateCampaign} disabled={isCreating}>
                  {isCreating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Campaign'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-8">
              <Facebook className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No campaigns yet</h3>
              <p className="text-muted-foreground mt-2 mb-4">
                Create your first Facebook ad campaign to start reaching customers.
              </p>
              <Button onClick={() => setShowDialog(true)}>
                <Plus className="mr-2 h-4 w-4" /> Create Campaign
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {campaigns.map((campaign) => {
                const status = formatStatus(campaign.status);
                
                return (
                  <Card key={campaign.id} className="overflow-hidden">
                    <div className="flex flex-col sm:flex-row">
                      {campaign.image_url && (
                        <div className="w-full sm:w-1/4 max-h-32 overflow-hidden">
                          <img 
                            src={campaign.image_url} 
                            alt={campaign.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className={`flex-1 p-4 ${campaign.image_url ? '' : 'w-full'}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-lg">{campaign.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              Created {new Date(campaign.created_at).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge className={status.color}>
                            {status.label}
                          </Badge>
                        </div>
                        
                        <div className="mt-4 flex justify-between items-center">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Facebook className="h-4 w-4 mr-1" />
                            {campaign.platform_campaign_id ? (
                              <span className="flex items-center">
                                <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                                Live on Facebook
                              </span>
                            ) : (
                              "Facebook Ads"
                            )}
                          </div>
                          <div>
                            {campaign.status === "completed" && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => {
                                  // Open Facebook Ads Manager in a new tab
                                  if (campaign.platform_campaign_id) {
                                    window.open(
                                      `https://www.facebook.com/adsmanager/manage/campaigns?act=${campaign.platform_campaign_id}`,
                                      '_blank'
                                    );
                                  }
                                }}
                              >
                                View on Facebook
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
