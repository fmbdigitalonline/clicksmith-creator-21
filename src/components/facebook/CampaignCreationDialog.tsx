
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Check, Facebook, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FacebookConnect } from "./FacebookConnect";
import { CampaignSettings } from "./CampaignSettings";
import { AdPreview } from "./AdPreview";
import { BusinessIdea, TargetAudience } from "@/types/adWizard";

interface CampaignCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  adVariants: any[];
  businessIdea?: BusinessIdea;
  targetAudience?: TargetAudience;
}

export const CampaignCreationDialog = ({
  open,
  onOpenChange,
  projectId,
  adVariants,
  businessIdea,
  targetAudience
}: CampaignCreationDialogProps) => {
  const [step, setStep] = useState("connect"); // connect, settings, confirm, creating, complete
  const [isCreating, setIsCreating] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [settings, setSettings] = useState({
    dailyBudget: 10,
    startDate: new Date(),
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    objective: "REACH",
    ageMin: 18,
    ageMax: 65,
    genders: ["male", "female"],
    locations: [],
    interests: []
  });
  
  const { toast } = useToast();

  const handleNext = () => {
    if (step === "connect") {
      setStep("settings");
    } else if (step === "settings") {
      if (!campaignName.trim()) {
        toast({
          title: "Campaign name required",
          description: "Please provide a name for your campaign",
          variant: "destructive"
        });
        return;
      }
      setStep("confirm");
    } else if (step === "confirm") {
      handleCreateCampaign();
    }
  };

  const handleBack = () => {
    if (step === "settings") {
      setStep("connect");
    } else if (step === "confirm") {
      setStep("settings");
    }
  };

  const handleCreateCampaign = async () => {
    setIsCreating(true);
    setStep("creating");
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");
      
      // Get selected ads and format them for the API
      const formattedAds = adVariants.map(ad => ({
        headline: ad.headline,
        description: ad.description,
        imageUrl: ad.imageUrl || ad.image?.url,
        platform: ad.platform
      }));
      
      // Call edge function to create campaign
      const { data, error } = await supabase.functions.invoke('facebook-campaign', {
        body: {
          projectId,
          campaignName,
          settings,
          ads: formattedAds,
          businessIdea,
          targetAudience
        }
      });
      
      if (error) throw error;
      
      // Save campaign to database - FIX: Pass an array with a single object
      await supabase.from('ad_campaigns').insert([{
        project_id: projectId,
        platform: 'facebook',
        name: campaignName,
        budget: settings.dailyBudget,
        start_date: settings.startDate,
        end_date: settings.endDate,
        targeting: settings,
        status: 'active',
        platform_campaign_id: data.campaignId
      }]);
      
      toast({
        title: "Campaign Created",
        description: "Your Facebook ad campaign has been created successfully.",
      });
      
      setStep("complete");
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast({
        title: "Campaign Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create campaign. Please try again.",
        variant: "destructive"
      });
      setStep("confirm");
    } finally {
      setIsCreating(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case "connect":
        return (
          <div className="space-y-6 py-4">
            <p className="text-sm text-muted-foreground">
              To create a Facebook ad campaign, you need to connect your Facebook Ad account first.
            </p>
            <FacebookConnect 
              onConnected={() => setIsConnected(true)}
            />
          </div>
        );
      
      case "settings":
        return (
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="campaign-name">Campaign Name</Label>
                <Input 
                  id="campaign-name" 
                  value={campaignName} 
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. Summer Sale 2023"
                />
              </div>
              
              <CampaignSettings 
                settings={settings}
                onSettingsChange={setSettings}
                targetAudience={targetAudience}
              />
            </div>
          </div>
        );
        
      case "confirm":
        return (
          <div className="space-y-6 py-4">
            <h3 className="text-lg font-medium">Campaign Preview</h3>
            <Tabs defaultValue="settings">
              <TabsList className="grid grid-cols-2">
                <TabsTrigger value="settings">Campaign Settings</TabsTrigger>
                <TabsTrigger value="ads">Ad Previews</TabsTrigger>
              </TabsList>
              
              <TabsContent value="settings" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Campaign Name</p>
                    <p className="text-sm text-muted-foreground">{campaignName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Daily Budget</p>
                    <p className="text-sm text-muted-foreground">${settings.dailyBudget}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Start Date</p>
                    <p className="text-sm text-muted-foreground">{settings.startDate.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">End Date</p>
                    <p className="text-sm text-muted-foreground">{settings.endDate.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Age Range</p>
                    <p className="text-sm text-muted-foreground">{settings.ageMin} - {settings.ageMax}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Genders</p>
                    <p className="text-sm text-muted-foreground capitalize">{settings.genders.join(', ')}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="ads" className="mt-4">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">Preview of ads that will be created:</p>
                  <div className="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto">
                    {adVariants.slice(0, 3).map((ad, index) => (
                      <AdPreview key={index} ad={ad} />
                    ))}
                    {adVariants.length > 3 && (
                      <p className="text-sm text-center text-muted-foreground">
                        + {adVariants.length - 3} more ads
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        );
        
      case "creating":
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-facebook" />
            <div className="text-center">
              <h3 className="font-medium">Creating your Facebook campaign</h3>
              <p className="text-sm text-muted-foreground">This may take a moment...</p>
            </div>
          </div>
        );
        
      case "complete":
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-center">
              <h3 className="font-medium">Campaign Created Successfully!</h3>
              <p className="text-sm text-muted-foreground">
                Your Facebook campaign "{campaignName}" has been created and is now active.
              </p>
            </div>
            <Button 
              className="mt-4"
              onClick={() => onOpenChange(false)}
            >
              Done
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5 text-facebook" />
            {step === "complete" 
              ? "Campaign Created" 
              : "Create Facebook Ad Campaign"}
          </DialogTitle>
          <DialogDescription>
            {step === "connect" && "Connect your Facebook account to publish ads."}
            {step === "settings" && "Configure your campaign settings."}
            {step === "confirm" && "Review your campaign before publishing."}
          </DialogDescription>
        </DialogHeader>
        
        {step !== "complete" && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step === "connect" ? "bg-facebook text-white" : "bg-gray-200"}`}>1</div>
              <Separator className="w-8" />
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step === "settings" ? "bg-facebook text-white" : "bg-gray-200"}`}>2</div>
              <Separator className="w-8" />
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step === "confirm" || step === "creating" ? "bg-facebook text-white" : "bg-gray-200"}`}>3</div>
            </div>
          </div>
        )}
        
        {renderStepContent()}
        
        {(step !== "creating" && step !== "complete") && (
          <DialogFooter className="flex justify-between">
            {step !== "connect" && (
              <Button 
                variant="outline" 
                onClick={handleBack}
              >
                Back
              </Button>
            )}
            <Button 
              onClick={handleNext}
              disabled={step === "connect" && !isConnected}
            >
              {step === "confirm" ? "Create Campaign" : "Next"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
