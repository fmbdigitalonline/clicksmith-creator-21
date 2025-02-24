
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ChartBar, Calendar, Target, DollarSign, Facebook } from "lucide-react";
import { format } from "date-fns";

// Interface for raw data from Supabase
interface RawCampaignData {
  id: string;
  name: string;
  status: string;
  budget: number;
  start_date: string;
  end_date: string;
  platform: 'facebook' | 'google' | 'linkedin' | 'tiktok';
  platform_campaign_id: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  budget: number;
  start_date: string;
  end_date: string;
  objective: string | null;
  target_audience: any | null;
  performance_metrics: {
    impressions?: number;
    clicks?: number;
    spend?: number;
  } | null;
  platform: 'facebook' | 'google' | 'linkedin' | 'tiktok';
  platform_campaign_id: string | null;
  project_id: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

export const CampaignPreview = () => {
  const { toast } = useToast();
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ad_campaigns')
        .select('*')
        .eq('platform', 'facebook')
        .order('created_at', { ascending: false });

      if (error) {
        toast({
          title: "Error fetching campaigns",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      // Transform the raw data to match the Campaign interface
      return (data as RawCampaignData[]).map(campaign => ({
        ...campaign,
        objective: null,
        target_audience: null,
        performance_metrics: null
      })) as Campaign[];
    },
  });

  const selectedCampaign = campaigns?.find(c => c.id === selectedCampaignId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Facebook className="h-5 w-5" />
            <CardTitle>Meta Ad Campaigns</CardTitle>
          </div>
          <Button variant="outline" onClick={() => setSelectedCampaignId(null)}>
            New Campaign
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading campaigns...</div>
        ) : campaigns?.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No campaigns found. Create your first campaign to get started.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Campaign List */}
            <div className="grid gap-4">
              {campaigns?.map((campaign) => (
                <Card
                  key={campaign.id}
                  className={`cursor-pointer transition-colors hover:bg-accent ${
                    selectedCampaignId === campaign.id ? 'border-primary' : ''
                  }`}
                  onClick={() => setSelectedCampaignId(campaign.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{campaign.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Status: {campaign.status}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">Daily Budget</p>
                          <p className="text-lg font-semibold">
                            ${campaign.budget}
                          </p>
                        </div>
                        <ChartBar className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Campaign Details */}
            {selectedCampaign && (
              <div className="space-y-6 pt-4 border-t">
                <h3 className="text-lg font-semibold">Campaign Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      <Label>Objective</Label>
                    </div>
                    <p className="text-sm">{selectedCampaign.objective || 'Not set'}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-primary" />
                      <Label>Budget</Label>
                    </div>
                    <p className="text-sm">
                      ${selectedCampaign.budget} per day
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      <Label>Duration</Label>
                    </div>
                    <p className="text-sm">
                      {selectedCampaign.start_date ? format(new Date(selectedCampaign.start_date), 'PP') : 'Not set'} -{' '}
                      {selectedCampaign.end_date ? format(new Date(selectedCampaign.end_date), 'PP') : 'Not set'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ChartBar className="h-4 w-4 text-primary" />
                      <Label>Performance</Label>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Impressions</p>
                        <p className="font-medium">
                          {selectedCampaign.performance_metrics?.impressions?.toLocaleString() ?? '0'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Clicks</p>
                        <p className="font-medium">
                          {selectedCampaign.performance_metrics?.clicks?.toLocaleString() ?? '0'}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Spend</p>
                        <p className="font-medium">
                          ${selectedCampaign.performance_metrics?.spend?.toFixed(2) ?? '0.00'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
