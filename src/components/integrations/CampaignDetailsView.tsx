
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { ArrowLeft, Facebook, ExternalLink, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import CampaignPerformance from "./CampaignPerformance";

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

export default function CampaignDetailsView() {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const session = useSession();
  const { toast } = useToast();

  useEffect(() => {
    if (session && campaignId) {
      fetchCampaignDetails();
    }
  }, [session, campaignId]);

  const fetchCampaignDetails = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("ad_campaigns")
        .select("*")
        .eq("id", campaignId)
        .single();

      if (error) throw error;
      
      setCampaign(data);
    } catch (error) {
      console.error("Error fetching campaign:", error);
      toast({
        title: "Error",
        description: "Failed to load campaign details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="p-8">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Campaigns
        </Button>
        <div className="mt-8 text-center">
          <h2 className="text-2xl font-bold">Campaign Not Found</h2>
          <p className="mt-2 text-muted-foreground">
            The campaign you're looking for doesn't exist or you don't have permission to view it.
          </p>
        </div>
      </div>
    );
  }

  const status = formatStatus(campaign.status);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Campaigns
        </Button>
        
        {campaign.platform_campaign_id && (
          <Button 
            variant="outline" 
            onClick={() => {
              window.open(
                `https://www.facebook.com/adsmanager/manage/campaigns?act=${campaign.platform_campaign_id}`,
                '_blank'
              );
            }}
          >
            <Facebook className="h-4 w-4 mr-2" />
            View on Facebook
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl">{campaign.name}</CardTitle>
              <CardDescription>
                Created on {format(new Date(campaign.created_at), "MMMM d, yyyy")}
              </CardDescription>
            </div>
            <Badge className={status.color}>
              {status.label}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="performance" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="details">Campaign Details</TabsTrigger>
              <TabsTrigger value="creative">Creative</TabsTrigger>
            </TabsList>
            
            <TabsContent value="performance">
              <CampaignPerformance campaignId={campaign.id} campaignName={campaign.name} />
            </TabsContent>
            
            <TabsContent value="details">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Campaign Settings</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <dl className="space-y-4">
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                          <dd className="mt-1">{status.label}</dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Platform</dt>
                          <dd className="mt-1 flex items-center">
                            <Facebook className="h-4 w-4 mr-2" /> 
                            Facebook Ads
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Budget</dt>
                          <dd className="mt-1">
                            {campaign.budget 
                              ? `$${campaign.budget} daily` 
                              : 'Not specified'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-muted-foreground">Campaign ID</dt>
                          <dd className="mt-1 font-mono text-sm">
                            {campaign.platform_campaign_id || 'Not published yet'}
                          </dd>
                        </div>
                      </dl>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Targeting</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {campaign.targeting ? (
                        <dl className="space-y-4">
                          {campaign.targeting.adSet && campaign.targeting.adSet.targeting && (
                            <>
                              {campaign.targeting.adSet.targeting.age_min && (
                                <div>
                                  <dt className="text-sm font-medium text-muted-foreground">Age Range</dt>
                                  <dd className="mt-1">
                                    {campaign.targeting.adSet.targeting.age_min} - {campaign.targeting.adSet.targeting.age_max || '65+'}
                                  </dd>
                                </div>
                              )}
                              
                              {campaign.targeting.adSet.targeting.genders && (
                                <div>
                                  <dt className="text-sm font-medium text-muted-foreground">Gender</dt>
                                  <dd className="mt-1">
                                    {campaign.targeting.adSet.targeting.genders.includes(1) && campaign.targeting.adSet.targeting.genders.includes(2)
                                      ? 'All Genders'
                                      : campaign.targeting.adSet.targeting.genders.includes(1)
                                        ? 'Women'
                                        : 'Men'}
                                  </dd>
                                </div>
                              )}
                              
                              {campaign.targeting.adSet.targeting.geo_locations && (
                                <div>
                                  <dt className="text-sm font-medium text-muted-foreground">Locations</dt>
                                  <dd className="mt-1">
                                    {campaign.targeting.adSet.targeting.geo_locations.countries
                                      ? campaign.targeting.adSet.targeting.geo_locations.countries.join(', ')
                                      : 'Not specified'}
                                  </dd>
                                </div>
                              )}
                              
                              {campaign.targeting.adSet.targeting.interests && (
                                <div>
                                  <dt className="text-sm font-medium text-muted-foreground">Interests</dt>
                                  <dd className="mt-1">
                                    <div className="flex flex-wrap gap-1">
                                      {campaign.targeting.adSet.targeting.interests.map((interest: any, index: number) => (
                                        <Badge key={index} variant="outline">
                                          {interest.name}
                                        </Badge>
                                      ))}
                                    </div>
                                  </dd>
                                </div>
                              )}
                            </>
                          )}
                        </dl>
                      ) : (
                        <p className="text-muted-foreground">No targeting information available</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="creative">
              <div className="space-y-4">
                {campaign.image_url ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Ad Creative</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md overflow-hidden">
                        <img 
                          src={campaign.image_url} 
                          alt={campaign.name}
                          className="w-full max-h-80 object-contain"
                        />
                      </div>
                      {campaign.targeting && campaign.targeting.adCreative && (
                        <div className="mt-6 space-y-4">
                          <div>
                            <h4 className="font-medium">Ad Copy</h4>
                            <p className="mt-1">
                              {campaign.targeting.adCreative.object_story_spec?.link_data?.message || 'No message'}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium">Headline</h4>
                            <p className="mt-1">
                              {campaign.targeting.adCreative.object_story_spec?.link_data?.name || 'No headline'}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium">Call to Action</h4>
                            <p className="mt-1">
                              {campaign.targeting.adCreative.object_story_spec?.link_data?.call_to_action?.type || 'No CTA'}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="font-medium">Destination</h4>
                            <p className="mt-1">
                              {campaign.targeting.adCreative.object_story_spec?.link_data?.link || 'No destination URL'}
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="py-8">
                      <div className="text-center">
                        <p className="text-muted-foreground">No creative information available</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
