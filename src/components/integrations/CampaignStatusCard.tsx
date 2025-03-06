
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

interface CampaignStatusCardProps {
  campaignId: string;
}

export default function CampaignStatusCard({ campaignId }: CampaignStatusCardProps) {
  const [campaign, setCampaign] = useState<any>(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const { data, error } = await supabase
          .from("ad_campaigns")
          .select("*")
          .eq("id", campaignId)
          .single();

        if (error) throw error;
        
        setCampaign(data);
        
        // Set progress based on status
        switch (data.status) {
          case "pending":
            setProgress(25);
            break;
          case "campaign_created":
            setProgress(50);
            break;
          case "adset_created":
            setProgress(75);
            break;
          case "completed":
            setProgress(100);
            break;
          case "error":
            setProgress(0);
            setError(data.targeting?.error_message || "An error occurred");
            break;
          default:
            setProgress(10);
        }
      } catch (err) {
        console.error("Error fetching campaign:", err);
        setError("Could not fetch campaign status");
      } finally {
        setLoading(false);
      }
    };

    fetchCampaign();
    
    // Set up real-time listener
    const subscription = supabase
      .channel(`campaign_${campaignId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'ad_campaigns',
        filter: `id=eq.${campaignId}`
      }, (payload) => {
        setCampaign(payload.new);
        
        // Update progress based on new status
        switch (payload.new.status) {
          case "pending":
            setProgress(25);
            break;
          case "campaign_created":
            setProgress(50);
            break;
          case "adset_created":
            setProgress(75);
            break;
          case "completed":
            setProgress(100);
            break;
          case "error":
            setProgress(0);
            setError(payload.new.targeting?.error_message || "An error occurred");
            break;
          default:
            setProgress(10);
        }
      })
      .subscribe();

    // Clean up subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [campaignId]);

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center justify-center space-x-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span>Loading campaign status...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 border-red-300 bg-red-50">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">Campaign Error</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending":
        return "Initializing campaign...";
      case "campaign_created":
        return "Creating ad set...";
      case "adset_created":
        return "Creating ad creative...";
      case "completed":
        return "Campaign created successfully!";
      default:
        return "Processing...";
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-3">
        <h3 className="font-medium">{campaign?.name || "Facebook Campaign"}</h3>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <div className="flex items-center">
              {campaign?.status === "completed" ? (
                <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <Loader2 className="h-4 w-4 animate-spin text-primary mr-1" />
              )}
              <span>{getStatusLabel(campaign?.status)}</span>
            </div>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="text-xs text-muted-foreground">
          Created: {new Date(campaign?.created_at).toLocaleString()}
        </div>
      </div>
    </Card>
  );
}
