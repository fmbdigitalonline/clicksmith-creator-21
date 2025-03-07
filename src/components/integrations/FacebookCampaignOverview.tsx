
import { useState, useEffect, useCallback } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  AlertCircle, 
  Plus, 
  CheckCircle, 
  Facebook, 
  RefreshCw, 
  Save, 
  Copy, 
  BarChart3, 
  Play, 
  Trash, 
  Edit, 
  MoreVertical
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import FacebookCampaignForm from "./FacebookCampaignForm";
import CampaignStatusCard from "./CampaignStatusCard";
import { AutomaticModeMonitoring } from "./AutomaticModeMonitoring";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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

// Campaign action states - separate processing states for different operations
interface CampaignActionStates {
  deleting: Record<string, boolean>;
  saving: Record<string, boolean>;
  duplicating: Record<string, boolean>;
}

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [campaignToEdit, setCampaignToEdit] = useState<Campaign | null>(null);
  
  // Replace global isProcessing with granular action states
  const [actionStates, setActionStates] = useState<CampaignActionStates>({
    deleting: {},
    saving: {},
    duplicating: {}
  });
  
  const session = useSession();
  const { toast } = useToast();

  // Helper functions to update action states
  const setActionState = useCallback((actionType: keyof CampaignActionStates, campaignId: string, isActive: boolean) => {
    setActionStates(prev => ({
      ...prev,
      [actionType]: {
        ...prev[actionType],
        [campaignId]: isActive
      }
    }));
  }, []);

  // Check if a specific action is in progress
  const isActionInProgress = useCallback((actionType: keyof CampaignActionStates, campaignId: string) => {
    return actionStates[actionType][campaignId] === true;
  }, [actionStates]);

  // Check if any action is in progress
  const isAnyActionInProgress = useCallback(() => {
    return Object.values(actionStates).some(stateMap => 
      Object.values(stateMap).some(isActive => isActive)
    );
  }, [actionStates]);

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
      setIsRefreshing(false);
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
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await fetchCampaigns();
    } catch (error) {
      console.error("Error refreshing campaigns:", error);
      toast({
        title: "Error",
        description: "Failed to refresh campaigns",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const saveAsTemplate = async (campaign: Campaign) => {
    // Using individual action state instead of global isProcessing
    if (isActionInProgress('saving', campaign.id)) return;
    
    setActionState('saving', campaign.id, true);
    try {
      // Create a copy of the campaign as a template
      const { data, error } = await supabase
        .from("ad_campaigns")
        .insert({
          name: `Template: ${campaign.name}`,
          platform: "facebook" as const,
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
      
      // Optimistic UI update - add the new template to state
      if (data) {
        const newTemplate = mapCampaignData(data);
        setTemplates(prev => [newTemplate, ...prev]);
      }
    } catch (error) {
      console.error("Error saving template:", error);
      toast({
        title: "Error",
        description: "Failed to save campaign as template",
        variant: "destructive",
      });
    } finally {
      setActionState('saving', campaign.id, false);
    }
  };

  // Improved delete function with better state management
  const handleDeleteCampaign = async () => {
    if (!campaignToDelete) return;
    
    const campaignId = campaignToDelete.id;
    const isTemplate = campaignToDelete.is_template;
    
    // Set the specific campaign's delete state to true
    setActionState('deleting', campaignId, true);
    
    try {
      // Delete the campaign from the database
      const { error } = await supabase
        .from("ad_campaigns")
        .delete()
        .eq("id", campaignId);

      if (error) throw error;
      
      // Optimistic UI update - remove the deleted item from state
      if (isTemplate) {
        setTemplates(prev => prev.filter(t => t.id !== campaignId));
      } else {
        setCampaigns(prev => prev.filter(c => c.id !== campaignId));
      }
      
      toast({
        title: "Success",
        description: "Campaign deleted successfully",
      });
      
      // Reset states in the correct order
      setCampaignToDelete(null);
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting campaign:", error);
      toast({
        title: "Error",
        description: "Failed to delete campaign",
        variant: "destructive",
      });
    } finally {
      // Always clean up the deleting state, even if there's an error
      setActionState('deleting', campaignId, false);
    }
  };

  // Function to handle campaign duplication with isolated state
  const handleDuplicateCampaign = async (campaign: Campaign) => {
    if (isActionInProgress('duplicating', campaign.id)) return;
    
    setActionState('duplicating', campaign.id, true);
    try {
      // Create a copy of the campaign
      const { data, error } = await supabase
        .from("ad_campaigns")
        .insert({
          name: `Copy of ${campaign.name}`,
          platform: "facebook" as const,
          status: "draft",
          project_id: campaign.project_id,
          campaign_data: campaign.campaign_data,
          image_url: campaign.image_url,
          creation_mode: campaign.creation_mode,
          template_id: campaign.template_id,
          template_name: campaign.template_name
        })
        .select()
        .single();

      if (error) throw error;
      
      // Optimistic UI update - add the new campaign to the list
      if (data) {
        const newCampaign = mapCampaignData(data);
        setCampaigns(prev => [newCampaign, ...prev]);
      }
      
      toast({
        title: "Success",
        description: "Campaign duplicated successfully",
      });
    } catch (error) {
      console.error("Error duplicating campaign:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate campaign",
        variant: "destructive",
      });
    } finally {
      setActionState('duplicating', campaign.id, false);
    }
  };

  // Function to handle campaign edit
  const handleEditCampaign = (campaign: Campaign) => {
    setCampaignToEdit(campaign);
    setIsEditing(true);
    setShowDialog(true);
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
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleRefresh} 
              disabled={isRefreshing || isAnyActionInProgress()}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <FacebookCampaignForm
              open={showDialog}
              onOpenChange={(open) => {
                // Only reset edit state when closing the dialog
                if (!open) {
                  setIsEditing(false);
                  setCampaignToEdit(null);
                }
                setShowDialog(open);
              }}
              projectId={selectedProject}
              campaignToEdit={campaignToEdit}
              isEditing={isEditing}
              onSuccess={() => {
                // Reset state and refresh campaigns
                setIsEditing(false);
                setCampaignToEdit(null);
                fetchCampaigns();
              }}
            />
            <Button 
              onClick={() => {
                setCampaignToEdit(null);
                setIsEditing(false);
                setShowDialog(true);
              }}
              disabled={isAnyActionInProgress()}
            >
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
              <Button 
                onClick={() => setShowDialog(true)}
                disabled={isAnyActionInProgress()}
              >
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
                
                // Check if this specific campaign has operations in progress
                const isSaving = isActionInProgress('saving', campaign.id);
                const isDeleting = isActionInProgress('deleting', campaign.id);
                const isDuplicating = isActionInProgress('duplicating', campaign.id);
                const isCampaignProcessing = isSaving || isDeleting || isDuplicating;
                
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
                            {/* Add dropdown menu for actions */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" disabled={isCampaignProcessing}>
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEditCampaign(campaign)} disabled={isCampaignProcessing}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => handleDuplicateCampaign(campaign)}
                                  disabled={isCampaignProcessing}
                                >
                                  <Copy className="h-4 w-4 mr-2" />
                                  {isDuplicating ? "Duplicating..." : "Duplicate"}
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => {
                                    setCampaignToDelete(campaign);
                                    setIsDeleteDialogOpen(true);
                                  }}
                                  className="text-red-600"
                                  disabled={isCampaignProcessing}
                                >
                                  <Trash className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            {campaign.status === "completed" && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => saveAsTemplate(campaign)}
                                  disabled={isCampaignProcessing}
                                >
                                  {isSaving ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Save className="h-3 w-3 mr-1" />}
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
                                  disabled={isCampaignProcessing}
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
                                    disabled={isCampaignProcessing}
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
                                disabled={isCampaignProcessing}
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
              {templates.map((template) => {
                const isTemplateProcessing = isActionInProgress('deleting', template.id);
                
                return (
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
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setShowDialog(true);
                                // TODO: Pass template to campaign form
                              }}
                              disabled={isTemplateProcessing}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Use Template
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-600"
                              onClick={() => {
                                setCampaignToDelete(template);
                                setIsDeleteDialogOpen(true);
                              }}
                              disabled={isTemplateProcessing}
                            >
                              {isTemplateProcessing ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Trash className="h-3 w-3 mr-1" />
                              )}
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      
      {campaigns.some(campaign => campaign.creation_mode === "automatic" && campaign.status === "completed") && (
        <AutomaticModeMonitoring />
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog 
        open={isDeleteDialogOpen} 
        onOpenChange={(open) => {
          // Only allow closing if not currently processing
          if (!campaignToDelete || !isActionInProgress('deleting', campaignToDelete.id)) {
            setIsDeleteDialogOpen(open);
            if (!open) setCampaignToDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {campaignToDelete?.is_template 
                ? "This template will be permanently deleted." 
                : "This campaign will be permanently deleted. This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={campaignToDelete && isActionInProgress('deleting', campaignToDelete.id)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDeleteCampaign();
              }}
              disabled={!campaignToDelete || isActionInProgress('deleting', campaignToDelete.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              {campaignToDelete && isActionInProgress('deleting', campaignToDelete.id) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
