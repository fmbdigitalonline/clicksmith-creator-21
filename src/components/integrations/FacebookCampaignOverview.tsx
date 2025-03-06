
import { useState, useEffect } from "react";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, AlertCircle, Plus, CheckCircle, Facebook, RefreshCw, BarChart3 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import FacebookCampaignForm from "./FacebookCampaignForm";
import CampaignStatusCard from "./CampaignStatusCard";

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
  insights_data?: any;
  insights_last_updated?: string | null;
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const session = useSession();
  const { toast } = useToast();
  const navigate = useNavigate();

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
          updated_at: campaign.updated_at,
          insights_data: campaign.insights_data,
          insights_last_updated: campaign.insights_last_updated
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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchCampaigns();
    setIsRefreshing(false);
  };
  
  const handleCampaignClick = (campaignId: string) => {
    navigate(`/integrations/campaigns/${campaignId}`);
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
                
                // Check if we have insights data
                const hasInsights = campaign.insights_data && 
                                   campaign.insights_data.data && 
                                   campaign.insights_data.data.length > 0;
                
                // Extract key metrics if available
                let impressions = 0;
                let clicks = 0;
                let spend = 0;
                
                if (hasInsights) {
                  const insightData = campaign.insights_data.data[0];
                  impressions = insightData.impressions || 0;
                  clicks = insightData.clicks || 0;
                  spend = insightData.spend || 0;
                }
                
                return (
                  <Card 
                    key={campaign.id} 
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleCampaignClick(campaign.id)}
                  >
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
                        
                        {hasInsights && campaign.status === "completed" && (
                          <div className="mt-4 grid grid-cols-3 gap-2">
                            <div className="text-center p-2 bg-slate-50 rounded">
                              <p className="text-xs text-muted-foreground">Impressions</p>
                              <p className="font-semibold">{impressions.toLocaleString()}</p>
                            </div>
                            <div className="text-center p-2 bg-slate-50 rounded">
                              <p className="text-xs text-muted-foreground">Clicks</p>
                              <p className="font-semibold">{clicks.toLocaleString()}</p>
                            </div>
                            <div className="text-center p-2 bg-slate-50 rounded">
                              <p className="text-xs text-muted-foreground">Spend</p>
                              <p className="font-semibold">${spend.toFixed(2)}</p>
                            </div>
                          </div>
                        )}
                        
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
                              <div className="flex items-center gap-2">
                                {hasInsights && (
                                  <BarChart3 className="h-4 w-4 text-blue-500" />
                                )}
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/integrations/campaigns/${campaign.id}`);
                                  }}
                                >
                                  View Details
                                </Button>
                              </div>
                            )}
                            {campaign.status === "error" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Show detailed error in a toast
                                  if (campaign.targeting?.error_message) {
                                    toast({
                                      title: "Campaign Creation Error",
                                      description: campaign.targeting.error_message,
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
    </div>
  );
}
