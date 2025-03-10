
import { useState, useEffect } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, AlertCircle, Plus, CheckCircle, Facebook, RefreshCw, 
  Save, Copy, BarChart3, Play, Trash2, PauseCircle, AlertTriangle 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import FacebookCampaignForm from "./FacebookCampaignForm";
import CampaignStatusCard from "./CampaignStatusCard";
import { AutomaticModeMonitoring } from "./AutomaticModeMonitoring";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Update the Campaign interface to match the database schema and include new fields
interface Campaign {
  id: string;
  name: string;
  status: string;
  platform: string;
  created_at: string;
  platform_campaign_id: string | null;
  platform_ad_set_id: string | null;
  platform_ad_id: string | null;
  image_url?: string | null;
  targeting?: any;
  campaign_data?: any;
  budget?: number | null;
  end_date?: string | null;
  start_date?: string | null;
  user_id?: string | null;
  project_id?: string | null;
  updated_at?: string | null;
  creation_mode?: string;
  template_id?: string | null;
  template_name?: string | null;
  is_template?: boolean;
  performance_metrics?: any;
  last_synced_at?: string | null;
}

export default function FacebookCampaignOverview() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [budget, setBudget] = useState("5");
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // State for campaign actions
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [campaignToDeactivate, setCampaignToDeactivate] = useState<Campaign | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});
  const [isDeactivating, setIsDeactivating] = useState<Record<string, boolean>>({});
  const [isSavingTemplate, setIsSavingTemplate] = useState<Record<string, boolean>>({});
  
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
      
      // Fetch regular campaigns
      const { data: campaignsData, error: campaignsError } = await supabase
        .from("ad_campaigns")
        .select("*")
        .eq("platform", "facebook")
        .eq("is_template", false)
        .order("created_at", { ascending: false });

      if (campaignsError) throw campaignsError;
      
      // Fetch templates
      const { data: templatesData, error: templatesError } = await supabase
        .from("ad_campaigns")
        .select("*")
        .eq("platform", "facebook")
        .eq("is_template", true)
        .order("created_at", { ascending: false });

      if (templatesError) throw templatesError;
      
      // Map database response to Campaign interface for regular campaigns
      const typedCampaigns: Campaign[] = campaignsData?.map((campaign: any) => mapCampaignData(campaign)) || [];
      setCampaigns(typedCampaigns);
      
      // Map database response to Campaign interface for templates
      const typedTemplates: Campaign[] = templatesData?.map((template: any) => mapCampaignData(template)) || [];
      setTemplates(typedTemplates);
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

  const mapCampaignData = (campaign: any): Campaign => {
    // Extract image URL from either direct image_url field or from campaign_data JSON
    let imageUrl = campaign.image_url;
    
    // If no direct image_url, try to extract it from the campaign_data
    if (!imageUrl && campaign.campaign_data) {
      const campaignData = typeof campaign.campaign_data === 'string' 
        ? JSON.parse(campaign.campaign_data) 
        : campaign.campaign_data;
        
      if (campaignData?.adCreative?.object_story_spec?.link_data?.image_url) {
        imageUrl = campaignData.adCreative.object_story_spec.link_data.image_url;
      }
    }
    
    return {
      id: campaign.id,
      name: campaign.name || "", 
      status: campaign.status || "",
      platform: campaign.platform,
      created_at: campaign.created_at,
      platform_campaign_id: campaign.platform_campaign_id,
      platform_ad_set_id: campaign.platform_ad_set_id,
      platform_ad_id: campaign.platform_ad_id,
      image_url: imageUrl,
      targeting: campaign.targeting,
      campaign_data: campaign.campaign_data,
      budget: campaign.budget,
      start_date: campaign.start_date,
      end_date: campaign.end_date,
      user_id: campaign.user_id,
      project_id: campaign.project_id,
      updated_at: campaign.updated_at,
      creation_mode: campaign.creation_mode || "manual",
      template_id: campaign.template_id,
      template_name: campaign.template_name,
      is_template: campaign.is_template,
      performance_metrics: campaign.performance_metrics,
      last_synced_at: campaign.last_synced_at
    };
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
        return { label: "Paused", color: "bg-green-100 text-green-800" };
      case "active":
        return { label: "Active", color: "bg-green-600 text-white" };
      case "paused":
        return { label: "Paused", color: "bg-yellow-500 text-white" };
      case "error":
        return { label: "Error", color: "bg-red-100 text-red-800" };
      default:
        return { label: status, color: "bg-gray-100 text-gray-800" };
    }
  };

  const formatCreationMode = (mode: string) => {
    switch (mode) {
      case "manual":
        return { label: "Manual", color: "bg-gray-100 text-gray-800" };
      case "semi-automatic":
        return { label: "Semi-Auto", color: "bg-blue-100 text-blue-800" };
      case "automatic":
        return { label: "Automatic", color: "bg-purple-100 text-purple-800" };
      default:
        return { label: "Manual", color: "bg-gray-100 text-gray-800" };
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCampaigns();
    setIsRefreshing(false);
  };

  const saveAsTemplate = async (campaign: Campaign) => {
    try {
      setIsSavingTemplate(prev => ({ ...prev, [campaign.id]: true }));
      
      // Create a copy of the campaign as a template
      const { data, error } = await supabase
        .from("ad_campaigns")
        .insert({
          // Fix: Explicitly specify all required fields with correct types
          name: `Template: ${campaign.name}`,
          platform: "facebook" as const, // Fix: Use literal type to match expected "facebook" | "google" | "linkedin" | "tiktok"
          status: "template",
          is_template: true,
          template_name: campaign.name,
          campaign_data: campaign.campaign_data,
          image_url: campaign.image_url,
          creation_mode: campaign.creation_mode
        })
        .select()
        .single();

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Campaign saved as template",
      });
      
      // Refresh the list of templates
      fetchCampaigns();
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: "Failed to save campaign as template",
        variant: "destructive",
      });
    } finally {
      setIsSavingTemplate(prev => ({ ...prev, [campaign.id]: false }));
    }
  };
  
  const deactivateCampaign = async (campaign: Campaign) => {
    if (!campaign.platform_campaign_id || !campaign.platform_ad_set_id) {
      toast({
        title: "Error",
        description: "Campaign or ad set ID is missing",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsDeactivating(prev => ({ ...prev, [campaign.id]: true }));
      
      // Use the consolidated facebook-campaign-manager function
      const response = await supabase.functions.invoke('facebook-campaign-manager', {
        body: {
          operation: 'deactivate',
          campaignId: campaign.platform_campaign_id,
          adSetId: campaign.platform_ad_set_id,
          recordId: campaign.id
        }
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to deactivate campaign");
      }
      
      // Update the campaign in the local state
      setCampaigns(prev => prev.map(c => 
        c.id === campaign.id ? { ...c, status: 'paused' } : c
      ));

      toast({
        title: "Success",
        description: "Campaign paused successfully",
      });
    } catch (error) {
      console.error("Error deactivating campaign:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to pause campaign",
        variant: "destructive"
      });
    } finally {
      setIsDeactivating(prev => ({ ...prev, [campaign.id]: false }));
      setCampaignToDeactivate(null);
      setDeactivateConfirmOpen(false);
    }
  };
  
  const deleteCampaign = async (campaign: Campaign) => {
    try {
      setIsDeleting(prev => ({ ...prev, [campaign.id]: true }));
      
      // Use the consolidated facebook-campaign-manager function
      const response = await supabase.functions.invoke('facebook-campaign-manager', {
        body: {
          operation: 'delete',
          campaignId: campaign.platform_campaign_id,
          recordId: campaign.id
        }
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to delete campaign");
      }
      
      // Remove the campaign from the local state
      setCampaigns(prev => prev.filter(c => c.id !== campaign.id));

      toast({
        title: "Success",
        description: "Campaign deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete campaign",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(prev => ({ ...prev, [campaign.id]: false }));
      setCampaignToDelete(null);
      setDeleteConfirmOpen(false);
    }
  };

  // Confirmation dialog handlers
  const handleDeleteConfirm = (campaign: Campaign) => {
    setCampaignToDelete(campaign);
    setDeleteConfirmOpen(true);
  };
  
  const handleDeactivateConfirm = (campaign: Campaign) => {
    setCampaignToDeactivate(campaign);
    setDeactivateConfirmOpen(true);
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
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <FacebookCampaignForm
              open={showDialog}
              onOpenChange={setShowDialog}
              projectId={selectedProject}
              onSuccess={fetchCampaigns}
            />
            <Button onClick={() => setShowDialog(true)}>
              <Plus className="mr-2 h-4 w-4" /> Create Campaign
            </Button>
          </div>
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
                // For campaigns created in the last 10 minutes that aren't in a terminal state,
                // show the detailed status card
                const isRecent = (new Date().getTime() - new Date(campaign.created_at).getTime()) < 10 * 60 * 1000;
                const isInProgress = campaign.status !== "completed" && campaign.status !== "error";
                
                if (isRecent && isInProgress) {
                  return <CampaignStatusCard key={campaign.id} campaignId={campaign.id} />;
                }
                
                const status = formatStatus(campaign.status);
                const creationMode = formatCreationMode(campaign.creation_mode || "manual");
                
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
                          <div className="flex flex-col gap-2">
                            <Badge className={status.color}>
                              {status.label}
                            </Badge>
                            <Badge className={creationMode.color}>
                              {creationMode.label}
                            </Badge>
                          </div>
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
                            {campaign.template_name && (
                              <span className="ml-2">
                                • From template: {campaign.template_name}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            {campaign.status === "active" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeactivateConfirm(campaign)}
                                disabled={isDeactivating[campaign.id]}
                              >
                                {isDeactivating[campaign.id] ? (
                                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <PauseCircle className="h-3 w-3 mr-1" />
                                )}
                                Pause Campaign
                              </Button>
                            )}
                            
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteConfirm(campaign)}
                              disabled={isDeleting[campaign.id]}
                              className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border-red-200"
                            >
                              {isDeleting[campaign.id] ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3 mr-1" />
                              )}
                              Delete
                            </Button>

                            {(campaign.status === "completed" || campaign.status === "paused") && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => saveAsTemplate(campaign)}
                                  disabled={isSavingTemplate[campaign.id]}
                                >
                                  {isSavingTemplate[campaign.id] ? (
                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                  ) : (
                                    <Save className="h-3 w-3 mr-1" />
                                  )}
                                  Save as Template
                                </Button>
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
                                {campaign.creation_mode === "automatic" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      // Navigate to monitoring interface
                                      window.location.href = `/integrations/campaign/${campaign.id}/monitoring`;
                                    }}
                                  >
                                    <BarChart3 className="h-3 w-3 mr-1" /> View Metrics
                                  </Button>
                                )}
                              </>
                            )}
                            {campaign.status === "error" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  // Show detailed error in a toast
                                  if (campaign.campaign_data?.error_message) {
                                    toast({
                                      title: "Campaign Creation Error",
                                      description: campaign.campaign_data.error_message,
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                View Error
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

      {/* Templates Section */}
      {templates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Campaign Templates</CardTitle>
            <CardDescription>
              Reuse your successful campaigns with these saved templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {templates.map((template) => (
                <Card key={template.id} className="overflow-hidden">
                  <div className="flex flex-col sm:flex-row">
                    {template.image_url && (
                      <div className="w-full sm:w-1/4 max-h-32 overflow-hidden">
                        <img 
                          src={template.image_url} 
                          alt={template.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className={`flex-1 p-4 ${template.image_url ? '' : 'w-full'}`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-lg">{template.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            Created {new Date(template.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">
                          Template
                        </Badge>
                      </div>
                      
                      <div className="mt-4 flex justify-between items-center">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Facebook className="h-4 w-4 mr-1" />
                          Facebook Template
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setShowDialog(true);
                            // TODO: Pass template to campaign form
                          }}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Use Template
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {campaigns.some(campaign => campaign.creation_mode === "automatic" && campaign.status === "completed") && (
        <AutomaticModeMonitoring />
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this campaign? This action cannot be undone.
              {campaignToDelete?.status === "active" && (
                <Alert className="mt-4 bg-yellow-50 border-yellow-200">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertTitle className="text-yellow-800 text-sm font-medium">Warning</AlertTitle>
                  <AlertDescription className="text-yellow-700 text-sm">
                    This campaign is currently active. Deleting it will stop all ads from running.
                  </AlertDescription>
                </Alert>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => campaignToDelete && deleteCampaign(campaignToDelete)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting[campaignToDelete?.id || ''] ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deleting...</>
              ) : (
                <>Delete</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={deactivateConfirmOpen} onOpenChange={setDeactivateConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pause Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to pause this campaign? Your ads will stop running until you reactivate the campaign.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => campaignToDeactivate && deactivateCampaign(campaignToDeactivate)}
            >
              {isDeactivating[campaignToDeactivate?.id || ''] ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Pausing...</>
              ) : (
                <>Pause Campaign</>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
