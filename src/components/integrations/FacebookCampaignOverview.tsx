import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Facebook, Loader2, Settings, ExternalLink, Upload, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "@supabase/auth-helpers-react";
import { supabase } from "@/integrations/supabase/client";
import { transformToFacebookAdFormat } from "@/utils/facebookAdTransformer";
import { BusinessIdea, TargetAudience } from "@/types/adWizard";
import { Progress } from "@/components/ui/progress";
import { uploadMedia } from "@/utils/uploadUtils";

// Define an interface for the ad structure
interface AdCreative {
  headline?: string;
  description?: string;
  imageUrl?: string;
  [key: string]: any;
}

// Define the campaign creation states
type CampaignStatus = 'idle' | 'uploading' | 'creating' | 'finalizing' | 'success' | 'error';

export default function FacebookCampaignOverview() {
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [projectData, setProjectData] = useState<any>(null);
  const [adPreview, setAdPreview] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [campaignStatus, setCampaignStatus] = useState<CampaignStatus>('idle');
  const [progressValue, setProgressValue] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  
  const { toast } = useToast();
  const session = useSession();

  // Check if Facebook is connected
  useEffect(() => {
    const checkConnection = async () => {
      if (!session) return;
      
      try {
        const { data, error } = await supabase
          .from('platform_connections')
          .select('*')
          .eq('platform', 'facebook')
          .single();

        if (error) {
          if (error.code !== 'PGRST116') { // not_found error
            console.error("Error checking connection:", error);
          }
          setIsConnected(false);
        } else {
          setIsConnected(true);
        }
      } catch (error) {
        console.error("Error checking connection:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkConnection();
  }, [session]);

  // Fetch projects that have generated ads
  useEffect(() => {
    const fetchProjects = async () => {
      if (!session || !isConnected) return;
      
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('id, title, generated_ads')
          .not('generated_ads', 'is', null)
          .order('created_at', { ascending: false });

        if (error) throw error;
        
        // Filter projects that have generated ads
        const projectsWithAds = data.filter(project => 
          project.generated_ads && 
          Array.isArray(project.generated_ads) && 
          project.generated_ads.length > 0
        );
        
        setProjects(projectsWithAds);
      } catch (error) {
        console.error("Error fetching projects:", error);
        toast({
          title: "Error",
          description: "Failed to fetch projects with ads",
          variant: "destructive",
        });
      }
    };

    fetchProjects();
  }, [session, isConnected, toast]);

  // Fetch project data when a project is selected
  useEffect(() => {
    const fetchProjectData = async () => {
      if (!selectedProject) {
        setProjectData(null);
        return;
      }
      
      try {
        // Use separate queries instead of a join to avoid the error
        const { data: projectData, error: projectError } = await supabase
          .from('projects')
          .select('*')
          .eq('id', selectedProject)
          .single();

        if (projectError) throw projectError;
        
        // If the project has generated ads, preview the first one
        if (projectData.generated_ads && 
            Array.isArray(projectData.generated_ads) && 
            projectData.generated_ads.length > 0) {
          
          // Type cast firstAd to the AdCreative interface
          const firstAd = projectData.generated_ads[0] as AdCreative;
          
          // Transform to Facebook format if we have business_idea and target_audience
          if (projectData.business_idea && projectData.target_audience) {
            // Type-cast the data to ensure it matches the expected types
            const businessIdea = projectData.business_idea as BusinessIdea;
            const targetAudience = projectData.target_audience as TargetAudience;
            
            const facebookAdData = transformToFacebookAdFormat(
              businessIdea,
              targetAudience,
              firstAd
            );
            
            // Create a new object with optional chaining to handle undefined properties
            setAdPreview({
              headline: firstAd?.headline || '',
              description: firstAd?.description || '',
              imageUrl: firstAd?.imageUrl || '',
              facebookData: facebookAdData
            });
          } else {
            // Create a proper object with optional chaining
            setAdPreview({
              headline: firstAd?.headline || '',
              description: firstAd?.description || '',
              imageUrl: firstAd?.imageUrl || ''
            });
          }
        }
        
        setProjectData(projectData);
      } catch (error) {
        console.error("Error fetching project data:", error);
        toast({
          title: "Error",
          description: "Failed to fetch project details",
          variant: "destructive",
        });
      }
    };

    fetchProjectData();
  }, [selectedProject, toast]);

  // Handle project selection
  const handleProjectChange = (value: string) => {
    setSelectedProject(value);
  };

  // Handle image upload for campaign creation
  const handleImageUpload = async (imageUrl: string): Promise<string> => {
    try {
      // If the image is already a fully qualified URL not from our domain, use it as is
      if (imageUrl.startsWith('http') && !imageUrl.includes(window.location.hostname)) {
        return imageUrl;
      }
      
      // For local images, we need to fetch and upload them
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      // Create a file from the blob
      const fileName = imageUrl.split('/').pop() || 'ad-image.png';
      const file = new File([blob], fileName, { type: blob.type });
      
      // Upload the file using our utility
      const uploadedUrl = await uploadMedia(file);
      return uploadedUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image for Facebook ad');
    }
  };

  // Handle campaign creation
  const handleCreateCampaign = async () => {
    setIsGenerating(true);
    setCampaignStatus('uploading');
    setProgressValue(10);
    setErrorMessage(null);
    
    try {
      if (!adPreview || !adPreview.facebookData) {
        throw new Error('No ad preview data available');
      }
      
      // 1. Upload image if needed
      setProgressValue(20);
      let processedImageUrl = adPreview.imageUrl;
      if (adPreview.imageUrl) {
        try {
          processedImageUrl = await handleImageUpload(adPreview.imageUrl);
          adPreview.facebookData.adCreative.object_story_spec.link_data.image_url = processedImageUrl;
        } catch (error) {
          console.error('Image upload failed:', error);
          toast({
            title: "Image Upload Failed",
            description: "We'll continue with the campaign creation without an image.",
            variant: "destructive",
          });
        }
      }
      
      // 2. Create the campaign
      setCampaignStatus('creating');
      setProgressValue(40);
      
      // Make the API call to create the campaign
      const { data: campaignData, error: campaignError } = await supabase.functions.invoke('create-facebook-campaign', {
        body: {
          campaignData: adPreview.facebookData.campaign,
          adSetData: adPreview.facebookData.adSet,
          adCreativeData: adPreview.facebookData.adCreative,
          projectId: selectedProject
        },
      });
      
      if (campaignError) {
        throw new Error(campaignError.message || 'Failed to create campaign');
      }
      
      // 3. Store the campaign data
      setCampaignStatus('finalizing');
      setProgressValue(80);
      
      // Save the campaign info to our database
      const { data: savedCampaign, error: saveError } = await supabase
        .from('ad_campaigns')
        .insert({
          project_id: selectedProject,
          platform: 'facebook',
          status: 'draft',
          platform_campaign_id: campaignData.campaignId || null,
          platform_ad_set_id: campaignData.adSetId || null,
          platform_ad_id: campaignData.adId || null,
          campaign_data: adPreview.facebookData,
          image_url: processedImageUrl
        })
        .select()
        .single();
      
      if (saveError) {
        throw new Error(saveError.message || 'Failed to save campaign data');
      }
      
      // Success
      setCampaignStatus('success');
      setProgressValue(100);
      setCampaignId(savedCampaign.id);
      
      toast({
        title: "Campaign Created",
        description: "Your Facebook campaign has been created and is ready for review.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error creating campaign:", error);
      setCampaignStatus('error');
      setProgressValue(0);
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error occurred');
      
      toast({
        title: "Campaign Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create Facebook campaign",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Facebook Campaign Creator</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Render disconnected state
  if (!isConnected) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Facebook Campaign Creator</CardTitle>
          <CardDescription>Transform your ads into Facebook campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Facebook Not Connected</AlertTitle>
            <AlertDescription>
              Please connect your Facebook Ads account to create campaigns.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Facebook Campaign Creator</CardTitle>
            <CardDescription>Transform your ads into Facebook campaigns</CardDescription>
          </div>
          <Badge 
            variant="outline" 
            className="bg-blue-50 text-blue-700 border-blue-200 flex items-center"
          >
            <Facebook className="w-3 h-3 mr-1" /> Facebook Ads
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {projects.length === 0 ? (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Projects Found</AlertTitle>
            <AlertDescription>
              You need to create projects with ad creatives before you can create Facebook campaigns.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div>
              <label htmlFor="project-select" className="block text-sm font-medium text-gray-700 mb-1">
                Select Project with Ads
              </label>
              <Select onValueChange={handleProjectChange} value={selectedProject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProject && projectData && (
              <div className="space-y-4 pt-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Project info */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Campaign Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="grid grid-cols-3">
                        <span className="text-muted-foreground">Project:</span>
                        <span className="col-span-2 font-medium">{projectData.title}</span>
                      </div>
                      <div className="grid grid-cols-3">
                        <span className="text-muted-foreground">Ad Creatives:</span>
                        <span className="col-span-2 font-medium">
                          {projectData.generated_ads && Array.isArray(projectData.generated_ads) 
                            ? projectData.generated_ads.length 
                            : 0} available
                        </span>
                      </div>
                      <div className="grid grid-cols-3">
                        <span className="text-muted-foreground">Audience:</span>
                        <span className="col-span-2 font-medium truncate">
                          {projectData.target_audience?.name || "Not specified"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3">
                        <span className="text-muted-foreground">Status:</span>
                        <span className="col-span-2">
                          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                            Draft
                          </Badge>
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Ad preview */}
                  {adPreview && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Ad Preview</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="aspect-w-1 aspect-h-1 rounded-md overflow-hidden bg-gray-100">
                          {adPreview.imageUrl && (
                            <img 
                              src={adPreview.imageUrl} 
                              alt="Ad Creative" 
                              className="w-full h-auto object-cover"
                            />
                          )}
                        </div>
                        <div className="pt-2">
                          <p className="font-medium">{adPreview.headline || "Ad Headline"}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {adPreview.description || "Ad description text will appear here."}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
                
                {adPreview?.facebookData && (
                  <Card className="mt-4">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span>Facebook Ad Data Preview</span>
                        <Button variant="outline" size="sm" className="h-7 gap-1">
                          <Settings className="w-3.5 h-3.5" />
                          <span className="text-xs">Configure</span>
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-muted-foreground mb-1">Campaign</p>
                          <p className="font-medium">{adPreview.facebookData.campaign.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Objective: {adPreview.facebookData.campaign.objective}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Ad Set</p>
                          <p className="font-medium">{adPreview.facebookData.adSet.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Budget: ${adPreview.facebookData.adSet.daily_budget / 100}/day
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">Targeting</p>
                          <p className="font-medium">
                            Ages {adPreview.facebookData.adSet.targeting.age_min}-
                            {adPreview.facebookData.adSet.targeting.age_max}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {adPreview.facebookData.adSet.targeting.interests 
                              ? adPreview.facebookData.adSet.targeting.interests.length 
                              : 0} interests
                          </p>
                        </div>
                      </div>
                      
                      {/* Campaign Progress/Status Section */}
                      {campaignStatus !== 'idle' && (
                        <div className="pt-3 pb-2">
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">
                              {campaignStatus === 'uploading' && 'Uploading image...'}
                              {campaignStatus === 'creating' && 'Creating campaign...'}
                              {campaignStatus === 'finalizing' && 'Finalizing...'}
                              {campaignStatus === 'success' && 'Campaign created successfully!'}
                              {campaignStatus === 'error' && 'Failed to create campaign'}
                            </span>
                            <span className="text-xs text-muted-foreground">{progressValue}%</span>
                          </div>
                          <Progress value={progressValue} className="h-2" />
                          
                          {campaignStatus === 'error' && errorMessage && (
                            <Alert variant="destructive" className="mt-3">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>Error</AlertTitle>
                              <AlertDescription>{errorMessage}</AlertDescription>
                            </Alert>
                          )}
                          
                          {campaignStatus === 'success' && (
                            <Alert className="mt-3 bg-green-50 border-green-200">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <AlertTitle className="text-green-800">Success!</AlertTitle>
                              <AlertDescription className="text-green-700">
                                Your campaign was created and is now in draft mode in Facebook Ads Manager
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      )}
                      
                      <div className="pt-2 flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="gap-1"
                          onClick={() => window.open('https://www.facebook.com/adsmanager', '_blank')}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Open Ads Manager</span>
                        </Button>
                        <Button 
                          size="sm"
                          className="gap-1"
                          onClick={handleCreateCampaign}
                          disabled={isGenerating || campaignStatus === 'success'}
                        >
                          {(isGenerating || ['uploading', 'creating', 'finalizing'].includes(campaignStatus)) ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>Processing...</span>
                            </>
                          ) : campaignStatus === 'success' ? (
                            <>
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Created</span>
                            </>
                          ) : (
                            <>
                              <Facebook className="w-3.5 h-3.5" />
                              <span>Create Campaign</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
