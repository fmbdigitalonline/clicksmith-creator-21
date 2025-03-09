
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ExternalLink, Plus, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link, useNavigate } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface Campaign {
  id: string;
  name: string;
  status: string;
  platform_campaign_id?: string; // Changed from fb_campaign_id to match database
  created_at: string;
  // Add additional fields from the database
  campaign_data?: Record<string, any>;
  spent?: number;
  impressions?: number;
  clicks?: number;
  // Remove objective as it's not in the database response
}

interface FacebookCampaignOverviewProps {
  onCreateCampaign: () => void;
}

export default function FacebookCampaignOverview({ onCreateCampaign }: FacebookCampaignOverviewProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [connectionValid, setConnectionValid] = useState<boolean | null>(null);

  const { data: campaigns, isLoading, error, refetch } = useQuery({
    queryKey: ['facebookCampaigns'],
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('ad_campaigns')
        .select('*')
        .eq('platform', 'facebook')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Campaign[];
    },
    retry: 1,
  });

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user) {
          setConnectionValid(false);
          return;
        }

        const { data, error } = await supabase
          .from('platform_connections')
          .select('*')
          .eq('platform', 'facebook')
          .eq('user_id', userData.user.id)
          .single();

        if (error || !data || !data.access_token) {
          setConnectionValid(false);
        } else {
          setConnectionValid(true);
        }
      } catch (error) {
        console.error('Error checking connection:', error);
        setConnectionValid(false);
      }
    };

    checkConnection();
  }, []);

  const handleViewMonitoring = (campaignId: string) => {
    navigate(`/integrations/campaign/${campaignId}/monitoring`);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Facebook Campaigns</CardTitle>
            <CardDescription>Manage your Facebook ad campaigns</CardDescription>
          </div>
          <Button 
            onClick={onCreateCampaign}
            disabled={connectionValid === false}
            variant="default"
          >
            <Plus className="mr-2 h-4 w-4" /> Create Campaign
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {connectionValid === false && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need to connect your Facebook account before creating campaigns.
            </AlertDescription>
          </Alert>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="py-6 text-center">
            <p className="text-sm text-red-600">Error loading campaigns. Please try again.</p>
            <Button variant="ghost" size="sm" onClick={() => refetch()} className="mt-2">
              Retry
            </Button>
          </div>
        ) : campaigns && campaigns.length > 0 ? (
          <ScrollArea className="h-[300px]">
            <div className="space-y-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="border rounded-md p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{campaign.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Status: <span className={`font-medium ${campaign.status === 'ACTIVE' ? 'text-green-600' : ''}`}>
                          {campaign.status || 'Unknown'}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {/* Display objective from campaign_data if available */}
                        Objective: {campaign.campaign_data?.campaign?.objective || 'Not specified'}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleViewMonitoring(campaign.id)}>
                      Monitor
                    </Button>
                  </div>
                  
                  {campaign.spent !== undefined && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="border rounded p-2 text-center">
                        <p className="text-xs text-muted-foreground">Spent</p>
                        <p className="font-medium">${campaign.spent?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div className="border rounded p-2 text-center">
                        <p className="text-xs text-muted-foreground">Impressions</p>
                        <p className="font-medium">{campaign.impressions?.toLocaleString() || '0'}</p>
                      </div>
                      <div className="border rounded p-2 text-center">
                        <p className="text-xs text-muted-foreground">Clicks</p>
                        <p className="font-medium">{campaign.clicks?.toLocaleString() || '0'}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">No Facebook campaigns found</p>
            <Button onClick={onCreateCampaign} disabled={connectionValid === false}>
              <Plus className="mr-2 h-4 w-4" /> Create your first campaign
            </Button>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-xs text-muted-foreground">
          Last updated: {new Date().toLocaleTimeString()}
        </p>
        <Button variant="ghost" size="sm" onClick={() => refetch()}>
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
}
