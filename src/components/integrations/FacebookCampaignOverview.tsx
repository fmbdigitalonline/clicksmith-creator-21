import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, PlusCircle, Trash2, RefreshCw, AlertCircle, FacebookIcon } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { transformToFacebookAdFormat } from "@/utils/facebookAdTransformer";
import { useParams } from "react-router-dom";
import { BusinessIdea, TargetAudience } from "@/types/adWizard";

interface PlatformConnection {
  id: string;
  platform: string;
  access_token: string;
  account_id: string | null;
  account_name: string | null;
  metadata?: {
    adAccounts?: Array<{id: string; name: string}>;
    pages?: Array<{id: string; name: string, access_token?: string}>;
    selectedAdAccountId?: string;
    selectedPageId?: string;
    pageAccessToken?: string;
  };
}

interface Campaign {
  id: string;
  name: string;
  platform: string;
  status: string;
  budget: number;
  platform_campaign_id: string;
  created_at: string;
}

export default function FacebookCampaignOverview() {
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(isCreating);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [connection, setConnection] = useState<PlatformConnection | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [adAccounts, setAdAccounts] = useState<Array<{id: string; name: string}>>([]);
  const [pages, setPages] = useState<Array<{id: string; name: string}>>([]);
  const [selectedAdAccount, setSelectedAdAccount] = useState<string | null>(null);
  const [selectedPage, setSelectedPage] = useState<string | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [campaignObjective, setCampaignObjective] = useState("OUTCOME_AWARENESS");
  const [campaignBudget, setCampaignBudget] = useState(5);
  const [campaignMessage, setCampaignMessage] = useState("");
  const [selectedAdId, setSelectedAdId] = useState<string | null>(null);
  const [savedAds, setSavedAds] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const { toast } = useToast();
  const session = useSession();
  const { projectId } = useParams();

  // Fetch connection and campaigns
  useEffect(() => {
    const fetchData = async () => {
      if (!session) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch Facebook connection
        const { data: connectionsData, error: connectionsError } = await supabase
          .from('platform_connections')
          .select('*')
          .eq('platform', 'facebook')
          .maybeSingle();

        if (connectionsError) throw connectionsError;

        if (connectionsData) {
          console.log("Facebook connection data:", connectionsData);
          setConnection(connectionsData as PlatformConnection);
          
          // Extract ad accounts and pages from metadata
          const metadata = (connectionsData as any).metadata || {};
          const fetchedAdAccounts = metadata.adAccounts || [];
          const fetchedPages = metadata.pages || [];
          
          setAdAccounts(fetchedAdAccounts);
          setPages(fetchedPages);
          
          // Set selected account and page from metadata
          setSelectedAdAccount(metadata.selectedAdAccountId || (fetchedAdAccounts.length > 0 ? fetchedAdAccounts[0].id : null));
          setSelectedPage(metadata.selectedPageId || (fetchedPages.length > 0 ? fetchedPages[0].id : null));
        }

        // Fetch campaigns
        const { data: campaignsData, error: campaignsError } = await supabase
          .from('ad_campaigns')
          .select('*')
          .eq('platform', 'facebook')
          .order('created_at', { ascending: false });

        if (campaignsError) throw campaignsError;
        
        setCampaigns(campaignsData || []);

        // Fetch saved ads
        const { data: adsData, error: adsError } = await supabase
          .from('ad_feedback')
          .select('*')
          .eq('platform', 'facebook')
          .eq('feedback', 'saved');

        if (adsError) throw adsError;
        setSavedAds(adsData || []);

        // Fetch projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('id, title, business_idea, target_audience')
          .order('created_at', { ascending: false });

        if (projectsError) throw projectsError;
        setProjects(projectsData || []);

        // If we have a project ID from URL, preselect it
        if (projectId && projectId !== 'new') {
          setSelectedProject(projectId);
          
          // Get data from the project
          const project = projectsData?.find(p => p.id === projectId);
          if (project) {
            setCampaignName(project.title + " Campaign");
            if (project.business_idea && typeof project.business_idea === 'object') {
              const businessIdea = project.business_idea as Record<string, any>;
              setCampaignMessage(businessIdea.valueProposition || "");
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load campaign data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [session, projectId, toast]);

  const handleCreateCampaign = async () => {
    if (!connection || !selectedAdAccount || !selectedPage) {
      toast({
        title: "Error",
        description: "Missing required account or page information",
        variant: "destructive",
      });
      return;
    }

    if (!campaignName) {
      toast({
        title: "Error",
        description: "Campaign name is required",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);

    try {
      // Get ad data if an ad was selected
      let adData: any = {};
      let targetUrl = "https://example.com";
      let imageUrl = null;
      let headline = "";
      let description = "";
      
      if (selectedAdId) {
        const selectedAd = savedAds.find(ad => ad.id === selectedAdId);
        if (selectedAd) {
          imageUrl = selectedAd.imageUrl || selectedAd.imageurl;
          headline = selectedAd.headline || "";
          description = selectedAd.primary_text || "";
        }
      }
      
      // Get project information if a project was selected
      let businessIdea: Partial<BusinessIdea> = {};
      let targetAudience: Partial<TargetAudience> = {};
      
      if (selectedProject) {
        const project = projects.find(p => p.id === selectedProject);
        if (project) {
          businessIdea = project.business_idea || {};
          targetAudience = project.target_audience || {};
        }
      }

      // Create campaign payload
      const campaignPayload = {
        name: campaignName,
        objective: campaignObjective,
        budget: campaignBudget,
        adAccountId: selectedAdAccount.replace('act_', ''),
        pageId: selectedPage,
        link: targetUrl,
        imageUrl: imageUrl,
        headline: headline || campaignName,
        description: description || campaignMessage,
        message: campaignMessage,
        callToAction: "LEARN_MORE",
        targeting: {
          age_min: 18,
          age_max: 65,
          geo_locations: {
            countries: ["US"]
          }
        },
        projectId: selectedProject
      };

      // Call the edge function to create the campaign
      const { data, error } = await supabase.functions.invoke('create-facebook-campaign', {
        body: campaignPayload
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || "Failed to create campaign");
      }

      // Refresh campaigns after creation
      const { data: newCampaigns, error: campaignsError } = await supabase
        .from('ad_campaigns')
        .select('*')
        .eq('platform', 'facebook')
        .order('created_at', { ascending: false });

      if (!campaignsError) {
        setCampaigns(newCampaigns || []);
      }

      toast({
        title: "Success!",
        description: "Your Facebook ad campaign has been created",
      });

      // Reset form and close dialog
      setIsDialogOpen(false);
      setCampaignName("");
      setCampaignMessage("");
      setSelectedAdId(null);
      setSelectedProject(null);
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast({
        title: "Campaign Creation Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Facebook Ad Campaigns</CardTitle>
          <CardDescription>Create and manage your ad campaigns</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!connection) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Facebook Ad Campaigns</CardTitle>
          <CardDescription>Connect your account to create campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Required</AlertTitle>
            <AlertDescription>
              You need to connect your Facebook Ads account before creating campaigns.
              Please go to the "Connect Platforms" tab first.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Facebook Ad Campaigns</CardTitle>
          <CardDescription>Create and manage your ad campaigns</CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create Facebook Ad Campaign</DialogTitle>
              <DialogDescription>
                Configure your campaign settings. The campaign will be created in paused state for your review.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="campaign-name">Campaign Name</Label>
                <Input
                  id="campaign-name"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Summer Sale 2023"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="campaign-objective">Objective</Label>
                  <Select value={campaignObjective} onValueChange={setCampaignObjective}>
                    <SelectTrigger id="campaign-objective">
                      <SelectValue placeholder="Select objective" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OUTCOME_AWARENESS">Awareness</SelectItem>
                      <SelectItem value="OUTCOME_ENGAGEMENT">Engagement</SelectItem>
                      <SelectItem value="OUTCOME_SALES">Sales</SelectItem>
                      <SelectItem value="OUTCOME_LEADS">Leads</SelectItem>
                      <SelectItem value="OUTCOME_TRAFFIC">Traffic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="campaign-budget">Daily Budget (USD)</Label>
                  <Input
                    id="campaign-budget"
                    type="number"
                    min="1"
                    value={campaignBudget}
                    onChange={(e) => setCampaignBudget(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project">Project (Optional)</Label>
                <Select value={selectedProject || ""} onValueChange={setSelectedProject}>
                  <SelectTrigger id="project">
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="saved-ad">Use Saved Ad (Optional)</Label>
                <Select value={selectedAdId || ""} onValueChange={setSelectedAdId}>
                  <SelectTrigger id="saved-ad">
                    <SelectValue placeholder="Select a saved ad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None</SelectItem>
                    {savedAds.map(ad => (
                      <SelectItem key={ad.id} value={ad.id}>
                        {ad.headline || "Untitled Ad"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="campaign-message">Ad Message</Label>
                <Textarea
                  id="campaign-message"
                  value={campaignMessage}
                  onChange={(e) => setCampaignMessage(e.target.value)}
                  placeholder="Enter your ad message here..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ad Account</Label>
                  <div className="p-2 border rounded-md text-sm">
                    {connection.account_name || "Default Account"}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Facebook Page</Label>
                  <div className="p-2 border rounded-md text-sm">
                    {pages.find(p => p.id === selectedPage)?.name || "No page selected"}
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreateCampaign} disabled={isCreating}>
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Campaign"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="active">
          <TabsList>
            <TabsTrigger value="active">Active Campaigns</TabsTrigger>
            <TabsTrigger value="paused">Paused Campaigns</TabsTrigger>
            <TabsTrigger value="all">All Campaigns</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="space-y-4 mt-4">
            {renderCampaignsList(campaigns.filter(c => c.status === 'ACTIVE'))}
          </TabsContent>
          
          <TabsContent value="paused" className="space-y-4 mt-4">
            {renderCampaignsList(campaigns.filter(c => c.status === 'PAUSED'))}
          </TabsContent>
          
          <TabsContent value="all" className="space-y-4 mt-4">
            {renderCampaignsList(campaigns)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );

  function renderCampaignsList(campaignsList: Campaign[]) {
    if (campaignsList.length === 0) {
      return (
        <div className="text-center py-10 border rounded-lg bg-muted/30">
          <div className="mb-2">
            <FacebookIcon className="mx-auto h-10 w-10 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground mb-4">No campaigns found</p>
          <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Your First Campaign
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {campaignsList.map((campaign) => (
          <div key={campaign.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">{campaign.name}</h3>
              <Badge 
                variant={campaign.status === 'ACTIVE' ? "default" : "secondary"}
              >
                {campaign.status}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm mb-3">
              <div>
                <span className="text-muted-foreground">Budget:</span> ${campaign.budget}/day
              </div>
              <div>
                <span className="text-muted-foreground">Created:</span> {new Date(campaign.created_at).toLocaleDateString()}
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm"
                disabled={true}
                title="Coming soon"
              >
                <RefreshCw className="h-4 w-4 mr-1" /> Update
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                disabled={true}
                title="Coming soon"
              >
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  }
}
