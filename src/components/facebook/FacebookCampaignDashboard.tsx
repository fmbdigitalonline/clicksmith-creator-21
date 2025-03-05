
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Facebook, RefreshCw, ExternalLink, AlertTriangle } from "lucide-react";
import { CampaignCreationDialog } from "./CampaignCreationDialog";
import { useToast } from "@/hooks/use-toast";

interface FacebookCampaignDashboardProps {
  projectId: string;
  adVariants: any[];
  businessIdea?: any;
  targetAudience?: any;
}

export const FacebookCampaignDashboard = ({ 
  projectId, 
  adVariants,
  businessIdea,
  targetAudience
}: FacebookCampaignDashboardProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkConnection();
    loadCampaigns();
  }, [projectId]);

  const checkConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: connection } = await supabase
        .from('platform_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'facebook')
        .maybeSingle();

      setIsConnected(!!connection?.access_token);
    } catch (error) {
      console.error("Error checking Facebook connection:", error);
    }
  };

  const loadCampaigns = async () => {
    setIsLoading(true);
    try {
      const { data } = await supabase
        .from('ad_campaigns')
        .select('*')
        .eq('project_id', projectId)
        .eq('platform', 'facebook')
        .order('created_at', { ascending: false });

      setCampaigns(data || []);
    } catch (error) {
      console.error("Error loading campaigns:", error);
      toast({
        title: "Error",
        description: "Failed to load campaigns",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshCampaignData = async (campaignId: string) => {
    setIsRefreshing(true);
    try {
      // Call edge function to get updated campaign data from Facebook
      const { data, error } = await supabase.functions.invoke('facebook-campaign-status', {
        body: { campaignId }
      });
      
      if (error) throw error;
      
      // Refresh campaigns list
      await loadCampaigns();
      
      toast({
        title: "Campaign refreshed",
        description: "Campaign data has been updated",
      });
    } catch (error) {
      console.error("Error refreshing campaign:", error);
      toast({
        title: "Refresh failed",
        description: error instanceof Error ? error.message : "Failed to refresh campaign data",
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const getCampaignStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string, label: string }> = {
      'ACTIVE': { color: 'bg-green-100 text-green-800', label: 'Active' },
      'PAUSED': { color: 'bg-yellow-100 text-yellow-800', label: 'Paused' },
      'DELETED': { color: 'bg-red-100 text-red-800', label: 'Deleted' },
      'ARCHIVED': { color: 'bg-gray-100 text-gray-800', label: 'Archived' },
      'PENDING_REVIEW': { color: 'bg-blue-100 text-blue-800', label: 'Pending Review' },
      'DISAPPROVED': { color: 'bg-red-100 text-red-800', label: 'Disapproved' },
      'DRAFT': { color: 'bg-purple-100 text-purple-800', label: 'Draft' }
    };

    const defaultStatus = { color: 'bg-gray-100 text-gray-800', label: status || 'Unknown' };
    const statusInfo = statusMap[status] || defaultStatus;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-facebook" />
      </div>
    );
  }

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5 text-facebook" />
            Facebook Campaigns
          </CardTitle>
          <CardDescription>
            Connect your Facebook account to create and manage campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
            <h3 className="text-lg font-medium mb-2">Facebook Account Not Connected</h3>
            <p className="text-sm text-gray-500 mb-4">
              You need to connect your Facebook account before you can create or manage campaigns.
            </p>
            <Button variant="facebook" onClick={() => setShowCreateDialog(true)}>
              <Facebook className="mr-2 h-4 w-4" />
              Connect and Create Campaign
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5 text-facebook" />
            Facebook Campaigns
          </CardTitle>
          <CardDescription>
            Create and manage your Facebook ad campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="bg-gray-100 rounded-full p-4 mb-4">
              <Facebook className="h-8 w-8 text-facebook" />
            </div>
            <h3 className="text-lg font-medium mb-2">No Campaigns Yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              You haven't created any Facebook campaigns for this project.
            </p>
            <Button variant="facebook" onClick={() => setShowCreateDialog(true)}>
              <Facebook className="mr-2 h-4 w-4" />
              Create Facebook Campaign
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Facebook Campaigns</h2>
        <Button variant="facebook" onClick={() => setShowCreateDialog(true)}>
          <Facebook className="mr-2 h-4 w-4" />
          Create New Campaign
        </Button>
      </div>

      <div className="grid gap-6">
        {campaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{campaign.name}</CardTitle>
                  <CardDescription>Created on {formatDate(campaign.created_at)}</CardDescription>
                </div>
                {getCampaignStatusBadge(campaign.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Daily Budget</p>
                  <p className="text-lg">{formatCurrency(campaign.budget)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Runtime</p>
                  <p>{formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-4 flex justify-between">
              <Button 
                variant="outline" 
                size="sm"
                disabled={isRefreshing}
                onClick={() => refreshCampaignData(campaign.platform_campaign_id)}
              >
                {isRefreshing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://www.facebook.com/ads/manager/account/campaigns/manage/?campaign_id=${campaign.platform_campaign_id}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View in Facebook
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <CampaignCreationDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        projectId={projectId}
        adVariants={adVariants}
        businessIdea={businessIdea}
        targetAudience={targetAudience}
      />
    </div>
  );
};
