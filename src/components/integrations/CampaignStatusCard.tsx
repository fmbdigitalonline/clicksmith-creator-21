
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, Clock, CheckCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface CampaignStatusCardProps {
  campaignId: string;
  refreshInterval?: number; // in milliseconds
}

export default function CampaignStatusCard({ 
  campaignId, 
  refreshInterval = 5000 
}: CampaignStatusCardProps) {
  const [campaign, setCampaign] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

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
        if (data.status === "completed" || data.status === "error") {
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
    if (campaign?.status !== "completed" && campaign?.status !== "error") {
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
        return { label: "Completed", icon: <CheckCircle className="h-3 w-3 mr-1" />, color: "bg-green-100 text-green-800" };
      case "error":
        return { label: "Error", icon: <AlertCircle className="h-3 w-3 mr-1" />, color: "bg-red-100 text-red-800" };
      default:
        return { label: status, icon: null, color: "bg-gray-100 text-gray-800" };
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
  const errorMessage = campaign.targeting?.error_message;

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
          <Alert variant="success" className="mb-4 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle>Campaign Created Successfully</AlertTitle>
            <AlertDescription className="text-sm">
              Your campaign has been created and is currently in a paused state. You can activate it in Facebook Ads Manager.
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
          
          {campaign.targeting?.campaign?.objective && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Objective:</span>
              <span className="font-medium">{campaign.targeting.campaign.objective}</span>
            </div>
          )}
          
          {campaign.targeting?.adSet?.daily_budget && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Daily Budget:</span>
              <span className="font-medium">${(campaign.targeting.adSet.daily_budget / 100).toFixed(2)}</span>
            </div>
          )}
        </div>
      </CardContent>
      
      {campaign.status === "completed" && (
        <CardFooter>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={viewOnFacebook}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View in Facebook Ads Manager
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
