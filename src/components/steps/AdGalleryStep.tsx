import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Facebook } from "lucide-react";
import { BusinessIdea, TargetAudience, AdHook } from "@/types/adWizard";
import { useToast } from "@/hooks/use-toast";
import { useCredits } from "@/hooks/useCredits";
import { supabase } from "@/integrations/supabase/client";
import { CampaignCreationDialog } from "@/components/facebook/CampaignCreationDialog";
import PlatformTabs from "./gallery/PlatformTabs";
import { FacebookCampaignDashboard } from "@/components/facebook/FacebookCampaignDashboard";

interface AdGalleryStepProps {
  businessIdea: BusinessIdea;
  targetAudience: TargetAudience;
  adHooks: AdHook[];
  onStartOver: () => void;
  onBack: () => void;
  onCreateProject: () => void;
  videoAdsEnabled?: boolean;
}

const AdGalleryStep = ({
  businessIdea,
  targetAudience,
  adHooks,
  onStartOver,
  onBack,
  onCreateProject,
  videoAdsEnabled
}: AdGalleryStepProps) => {
  const [activeTab, setActiveTab] = useState<"ads" | "campaigns">("ads");
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [adVariants, setAdVariants] = useState<any[]>([]);
  const { checkCredits } = useCredits();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Get project ID from URL if available
  const urlParts = window.location.pathname.split('/');
  const projectId = urlParts[urlParts.length - 1];
  const hasProject = projectId && projectId !== 'new' && !isNaN(Number(projectId));

  const handleGenerateMoreAds = async () => {
    // Check credits before generating
    const credits = await checkCredits(3);
    if (!credits.hasCredits) {
      toast({
        title: "Insufficient Credits",
        description: credits.errorMessage,
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    // Existing code for ad generation
    setIsGenerating(false);
  };

  const handleCreateCampaign = () => {
    if (hasProject) {
      setShowCampaignDialog(true);
    } else {
      onCreateProject();
    }
  };

  return (
    <div className="space-y-8">
      <Tabs defaultValue="ads" value={activeTab} onValueChange={(value) => setActiveTab(value as "ads" | "campaigns")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ads">Ad Gallery</TabsTrigger>
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="ads" className="pt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Your Ad Gallery</h2>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={onBack}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              
              <Button 
                variant="facebook"
                onClick={handleCreateCampaign}
              >
                <Facebook className="mr-2 h-4 w-4" />
                Create Facebook Campaign
              </Button>
            </div>
          </div>
          
          <PlatformTabs 
            businessIdea={businessIdea}
            targetAudience={targetAudience}
            adHooks={adHooks}
            onCreateProject={onCreateProject}
            videoAdsEnabled={videoAdsEnabled}
            onGetAdVariants={setAdVariants}
            projectId={hasProject ? projectId : undefined}
          />
        </TabsContent>
        
        <TabsContent value="campaigns" className="pt-6">
          {hasProject ? (
            <FacebookCampaignDashboard
              projectId={projectId}
              adVariants={adVariants}
              businessIdea={businessIdea}
              targetAudience={targetAudience}
            />
          ) : (
            <div className="text-center py-12 space-y-4">
              <p className="text-muted-foreground">You need to save your project before creating campaigns.</p>
              <Button onClick={onCreateProject}>Create Project</Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {showCampaignDialog && (
        <CampaignCreationDialog
          open={showCampaignDialog}
          onOpenChange={setShowCampaignDialog}
          projectId={projectId}
          adVariants={adVariants}
          businessIdea={businessIdea}
          targetAudience={targetAudience}
        />
      )}
    </div>
  );
};

export default AdGalleryStep;
