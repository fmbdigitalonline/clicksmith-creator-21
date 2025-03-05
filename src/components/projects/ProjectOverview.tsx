
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2, Facebook } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { CampaignCreationDialog } from "../facebook/CampaignCreationDialog";
import { FacebookCampaignDashboard } from "../facebook/FacebookCampaignDashboard";
import ProjectActions from "./ProjectActions";

interface ProjectOverviewProps {
  projectId: string;
  onNavigateToAdWizard: () => void;
  onBackToProjects: () => void;
}

const ProjectOverview = ({ 
  projectId,
  onNavigateToAdWizard,
  onBackToProjects
}: ProjectOverviewProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [businessIdea, setBusinessIdea] = useState<any>(null);
  const [targetAudience, setTargetAudience] = useState<any>(null);
  const [adVariants, setAdVariants] = useState<any[]>([]);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  
  useEffect(() => {
    if (projectId) {
      loadProjectData();
      loadAdVariants();
    }
  }, [projectId]);
  
  const loadProjectData = async () => {
    setIsLoading(true);
    try {
      // Load project details
      const { data: projectData } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
        
      setProject(projectData);
      
      // Load wizard progress for this project
      const { data: wizardData } = await supabase
        .from('wizard_progress')
        .select('*')
        .eq('user_id', projectData.user_id)
        .single();
        
      if (wizardData) {
        setBusinessIdea(wizardData.business_idea);
        setTargetAudience(wizardData.target_audience);
      }
    } catch (error) {
      console.error("Error loading project data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadAdVariants = async () => {
    try {
      // Load saved ads for this project
      const { data: savedAds } = await supabase
        .from('ad_feedback')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
        
      if (savedAds && savedAds.length > 0) {
        setAdVariants(savedAds.map(ad => ({
          id: ad.id,
          headline: ad.headline,
          description: ad.primary_text,
          imageUrl: ad.imageUrl || ad.imageurl,
          platform: ad.platform || 'facebook',
          size: ad.size || { width: 1200, height: 628, label: 'Facebook Feed' }
        })));
      }
    } catch (error) {
      console.error("Error loading ad variants:", error);
    }
  };
  
  const handleCreateCampaign = () => {
    setShowCampaignDialog(true);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="text-center py-12">
        <p>Project not found</p>
        <Button onClick={onBackToProjects} className="mt-4">Back to Projects</Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{project.title}</h1>
          <p className="text-muted-foreground mt-1">{project.description}</p>
        </div>
        
        <Button variant="facebook" onClick={handleCreateCampaign}>
          <Facebook className="mr-2 h-4 w-4" />
          Create Facebook Campaign
        </Button>
      </div>
      
      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="ads">Saved Ads</TabsTrigger>
          <TabsTrigger value="settings">Project Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="campaigns" className="space-y-6 pt-6">
          <FacebookCampaignDashboard
            projectId={projectId}
            adVariants={adVariants}
            businessIdea={businessIdea}
            targetAudience={targetAudience}
          />
        </TabsContent>
        
        <TabsContent value="ads" className="pt-6">
          {adVariants.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {adVariants.map((ad) => (
                <Card key={ad.id} className="overflow-hidden">
                  {ad.imageUrl && (
                    <div className="aspect-video w-full overflow-hidden">
                      <img 
                        src={ad.imageUrl} 
                        alt={ad.headline} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-facebook mb-2">{ad.headline}</h3>
                    <p className="text-sm text-gray-600 line-clamp-3">{ad.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">No ads saved for this project yet.</p>
              <Button onClick={onNavigateToAdWizard}>Generate Ads</Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="settings" className="pt-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <ProjectActions
                onGenerateAds={onNavigateToAdWizard}
                onBackToProjects={onBackToProjects}
                onGenerateCampaign={handleCreateCampaign}
                campaignEnabled={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <CampaignCreationDialog
        open={showCampaignDialog}
        onOpenChange={setShowCampaignDialog}
        projectId={projectId}
        adVariants={adVariants}
        businessIdea={businessIdea}
        targetAudience={targetAudience}
      />
    </div>
  );
};

export default ProjectOverview;
