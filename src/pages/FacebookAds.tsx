
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import FacebookConnect from "@/components/facebook/FacebookConnect";
import CreateCampaign from "@/components/facebook/CreateCampaign";
import CreateAd from "@/components/facebook/CreateAd";
import { supabase } from "@/integrations/supabase/client";
import { facebookAdsService } from "@/services/facebookAdsService";

const FacebookAds = () => {
  const [activeTab, setActiveTab] = useState("connect");
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string | null>(null);
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (projectId) {
      loadProject();
      loadCampaigns();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      setProject(data);
    } catch (error) {
      console.error("Error loading project:", error);
      toast({
        title: "Error",
        description: "Failed to load project data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCampaigns = async () => {
    try {
      const campaigns = await facebookAdsService.getCampaigns();
      const projectCampaigns = campaigns.filter(
        (campaign: any) => campaign.project_id === projectId
      );
      setCampaigns(projectCampaigns);

      // If there are campaigns, set the first one as selected
      if (projectCampaigns.length > 0) {
        setSelectedCampaign(projectCampaigns[0].id);
        setActiveTab("create-ad");
      }
    } catch (error) {
      console.error("Error loading campaigns:", error);
    }
  };

  const handleCampaignCreated = (campaignId: string) => {
    loadCampaigns();
    setSelectedCampaign(campaignId);
    setActiveTab("create-ad");
    toast({
      title: "Success",
      description: "Campaign created successfully. Now you can create ads.",
    });
  };

  const handleAdCreated = (adId: string) => {
    toast({
      title: "Success",
      description: "Ad created successfully.",
    });
    // Navigate to campaigns list or dashboard
    navigate("/projects");
  };

  const getGeneratedAd = () => {
    // Return the first generated ad from project data
    if (project && project.generated_ads && Array.isArray(project.generated_ads) && project.generated_ads.length > 0) {
      return project.generated_ads[0];
    }
    return null;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/projects/${projectId}`)}
          className="mr-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Project
        </Button>
        <h1 className="text-2xl font-bold">Facebook Ads Integration</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="connect">Connect Account</TabsTrigger>
          <TabsTrigger 
            value="create-campaign" 
            disabled={activeTab === "connect"}
          >
            Create Campaign
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connect" className="space-y-6">
          <FacebookConnect 
            onConnected={() => setActiveTab("create-campaign")} 
          />
        </TabsContent>

        <TabsContent value="create-campaign" className="space-y-6">
          <CreateCampaign 
            projectId={projectId || ""} 
            onSuccess={handleCampaignCreated}
            businessIdea={project?.business_idea}
            targetAudience={project?.target_audience}
          />
          
          {campaigns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Your Campaigns</CardTitle>
                <CardDescription>
                  Select a campaign to create ads for
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div 
                      key={campaign.id}
                      className={`p-4 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedCampaign === campaign.id ? "border-facebook bg-muted/50" : ""
                      }`}
                      onClick={() => {
                        setSelectedCampaign(campaign.id);
                        setActiveTab("create-ad");
                      }}
                    >
                      <h3 className="font-medium">{campaign.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Status: {campaign.status || "Draft"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Budget: ${campaign.budget || 0}/day
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="create-ad" className="space-y-6">
          {selectedCampaign ? (
            <CreateAd 
              projectId={projectId || ""} 
              adsetId={selectedCampaign} // This would typically be an adset ID
              onSuccess={handleAdCreated}
              generatedAd={getGeneratedAd()}
            />
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center p-6">
                <p className="text-center text-muted-foreground mb-4">
                  Please create a campaign first before creating ads.
                </p>
                <Button onClick={() => setActiveTab("create-campaign")}>
                  Create Campaign
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FacebookAds;
