
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Clock, CheckCircle, ExternalLink, Play, Pause } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@supabase/auth-helpers-react";

interface CampaignStatusCardProps {
  campaignId: string;
  refreshInterval?: number; // in milliseconds
  onActivate?: () => void;
  onDeactivate?: () => void;
}

export default function CampaignStatusCard({ 
  campaignId, 
  refreshInterval = 5000,
  onActivate,
  onDeactivate
}: CampaignStatusCardProps) {
  const [campaign, setCampaign] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivating, setIsActivating] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const session = useSession();

  // Fetch campaign data initially and on interval
  useEffect(() => {
    let intervalId: number;
    
    const fetchCampaign = async () => {
      try {
        setError(null);
        
        const { data, error } = await supabase
          .from("ad_campaigns")
          .select("*")
          .eq("id", campaignId)
          .single();
          
        if (error) throw error;
        setCampaign(data);
        
        // If campaign is in a terminal state, clear the interval
        if (data.status === "completed" || data.status === "error" || data.status === "active" || data.status === "paused") {
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error("Error fetching campaign:", err);
        setError("Failed to load campaign data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchCampaign();
    
    // Set up interval for polling if campaign is not in terminal state
    if (campaign?.status !== "completed" && campaign?.status !== "error" && 
        campaign?.status !== "active" && campaign?.status !== "paused") {
      intervalId = window.setInterval(fetchCampaign, refreshInterval);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [campaignId, refreshInterval]);

  // Format status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return { label: "Pending", icon: <Clock className="h-3 w-3 mr-1" />, color: "bg-yellow-100 text-yellow-800" };
      case "campaign_created":
        return { label: "Creating Campaign", icon: <Loader2 className="h-3 w-3 mr-1 animate-spin" />, color: "bg-blue-100 text-blue-800" };
      case "adset_created":
        return { label: "Creating Ad Set", icon: <Loader2 className="h-3 w-3 mr-1 animate-spin" />, color: "bg-blue-100 text-blue-800" };
      case "completed":
        return { label: "Completed (Paused)", icon: <CheckCircle className="h-3 w-3 mr-1" />, color: "bg-green-100 text-green-800" };
      case "active":
        return { label: "Active", icon: <CheckCircle className="h-3 w-3 mr-1" />, color: "bg-green-600 text-white" };
      case "paused":
        return { label: "Paused", icon: <Pause className="h-3 w-3 mr-1" />, color: "bg-orange-100 text-orange-800" };
      case "error":
        return { label: "Error", icon: <AlertCircle className="h-3 w-3 mr-1" />, color: "bg-red-100 text-red-800" };
      default:
        return { label: status, icon: null, color: "bg-gray-100 text-gray-800" };
    }
  };

  // Activate campaign function
  const activateCampaign = async () => {
    if (!campaign?.platform_campaign_id || !campaign?.platform_ad_set_id) {
      toast({
        title: "Error",
        description: "Campaign or ad set ID is missing",
        variant: "destructive"
      });
      return;
    }

    setIsActivating(true);

    try {
      // Call the facebook-campaign-manager endpoint with activate operation
      const response = await supabase.functions.invoke('facebook-campaign-manager', {
        body: {
          operation: 'activate',
          campaignId: campaign.platform_campaign_id,
          adSetId: campaign.platform_ad_set_id,
          recordId: campaign.id
        }
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to activate campaign");
      }

      // Refresh campaign data
      const { data, error } = await supabase
        .from("ad_campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();
        
      if (error) throw error;
      setCampaign(data);

      toast({
        title: "Success",
        description: "Campaign activated successfully",
      });

      // Call the onActivate callback if provided
      if (onActivate) {
        onActivate();
      }

    } catch (err: any) {
      console.error("Error activating campaign:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to activate campaign",
        variant: "destructive"
      });
    } finally {
      setIsActivating(false);
    }
  };

  // Deactivate campaign function
  const deactivateCampaign = async () => {
    if (!campaign?.platform_campaign_id || !campaign?.platform_ad_set_id) {
      toast({
        title: "Error",
        description: "Campaign or ad set ID is missing",
        variant: "destructive"
      });
      return;
    }

    setIsDeactivating(true);

    try {
      // Call the facebook-campaign-manager endpoint with deactivate operation
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

      // Refresh campaign data
      const { data, error } = await supabase
        .from("ad_campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();
        
      if (error) throw error;
      setCampaign(data);

      toast({
        title: "Success",
        description: "Campaign paused successfully",
      });

      // Call the onDeactivate callback if provided
      if (onDeactivate) {
        onDeactivate();
      }

    } catch (err: any) {
      console.error("Error deactivating campaign:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to deactivate campaign",
        variant: "destructive"
      });
    } finally {
      setIsDeactivating(false);
    }
  };

  // View campaign in Facebook Ads Manager
  const viewOnFacebook = () => {
    if (campaign?.platform_campaign_id) {
      window.open(
        `https://www.facebook.com/adsmanager/manage/campaigns?act=${campaign.platform_campaign_id}`,
        '_blank'
      );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p>Loading campaign status...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!campaign) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Campaign Not Found</AlertTitle>
        <AlertDescription>The campaign could not be found or has been deleted.</AlertDescription>
      </Alert>
    );
  }

  const status = getStatusBadge(campaign.status);
  const errorMessage = campaign.campaign_data?.error_message;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{campaign.name || "Facebook Campaign"}</span>
          <Badge className={status.color}>
            <span className="flex items-center">
              {status.icon}
              {status.label}
            </span>
          </Badge>
        </CardTitle>
        <CardDescription>
          Created on {new Date(campaign.created_at).toLocaleDateString()}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {campaign.status === "error" && errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Campaign Creation Failed</AlertTitle>
            <AlertDescription className="text-sm">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}
        
        {campaign.status === "completed" && (
          <Alert variant="default" className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Campaign Created Successfully</AlertTitle>
            <AlertDescription className="text-sm">
              Your campaign has been created and is currently in a paused state. You can activate it directly using the button below.
            </AlertDescription>
          </Alert>
        )}
        
        {campaign.status === "active" && (
          <Alert variant="default" className="mb-4 bg-green-100 border-green-300">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Campaign is Active</AlertTitle>
            <AlertDescription className="text-sm">
              Your campaign is now active and running on Facebook. You can view its performance in Facebook Ads Manager.
            </AlertDescription>
          </Alert>
        )}
        
        {campaign.status === "paused" && (
          <Alert variant="default" className="mb-4 bg-orange-50 border-orange-200">
            <Pause className="h-4 w-4 text-orange-600" />
            <AlertTitle>Campaign is Paused</AlertTitle>
            <AlertDescription className="text-sm">
              Your campaign is currently paused on Facebook. No ads are running or accruing costs.
            </AlertDescription>
          </Alert>
        )}
        
        {(campaign.status === "pending" || campaign.status === "campaign_created" || campaign.status === "adset_created") && (
          <Alert className="mb-4">
            <Clock className="h-4 w-4" />
            <AlertTitle>Campaign Creation in Progress</AlertTitle>
            <AlertDescription className="text-sm">
              Your campaign is being created. This may take a moment to complete.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-2">
          {campaign.platform_campaign_id && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Campaign ID:</span>
              <span className="font-medium">{campaign.platform_campaign_id}</span>
            </div>
          )}
          
          {campaign.platform_ad_set_id && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ad Set ID:</span>
              <span className="font-medium">{campaign.platform_ad_set_id}</span>
            </div>
          )}
          
          {campaign.platform_ad_id && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ad ID:</span>
              <span className="font-medium">{campaign.platform_ad_id}</span>
            </div>
          )}
          
          {campaign.campaign_data?.campaign?.objective && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Objective:</span>
              <span className="font-medium">{campaign.campaign_data.campaign.objective}</span>
            </div>
          )}
          
          {campaign.campaign_data?.adSet?.daily_budget && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Daily Budget:</span>
              <span className="font-medium">${(campaign.campaign_data.adSet.daily_budget / 100).toFixed(2)}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex gap-2 flex-col sm:flex-row">
        {(campaign.status === "completed" || campaign.status === "paused") && (
          <>
            <Button 
              className="w-full bg-facebook text-white hover:bg-facebook/90" 
              onClick={activateCampaign}
              disabled={isActivating || campaign.status === "active"}
            >
              {isActivating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Play className="h-4 w-4 mr-2" />
              )}
              Activate Campaign
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={viewOnFacebook}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View in Facebook Ads Manager
            </Button>
          </>
        )}
        
        {campaign.status === "active" && (
          <>
            <Button 
              variant="outline" 
              className="w-full text-orange-600 border-orange-200 hover:bg-orange-50" 
              onClick={deactivateCampaign}
              disabled={isDeactivating}
            >
              {isDeactivating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Pause className="h-4 w-4 mr-2" />
              )}
              Pause Campaign
            </Button>
            
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={viewOnFacebook}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View in Facebook Ads Manager
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
