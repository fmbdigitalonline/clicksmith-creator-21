
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FaFacebook } from "react-icons/fa";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BusinessIdea, TargetAudience } from "@/types/adWizard";

interface CampaignCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  businessIdea?: BusinessIdea;
  targetAudience?: TargetAudience;
  adVariants: any[];
  onSuccess?: (campaignId: string) => void;
}

export function CampaignCreationDialog({
  open,
  onOpenChange,
  projectId,
  businessIdea,
  targetAudience,
  adVariants,
  onSuccess,
}: CampaignCreationDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [campaignName, setCampaignName] = useState(
    businessIdea?.description ? `Campaign for ${businessIdea.description.substring(0, 30)}...` : "New Ad Campaign"
  );
  const [dailyBudget, setDailyBudget] = useState(10);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    try {
      // Get the current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14); // 2 weeks campaign by default

      // Prepare the targeting based on our target audience data
      const targeting = {
        dailyBudget,
        startDate,
        endDate,
        objective: "CONVERSIONS",
        ageMin: 18,
        ageMax: 65,
        genders: ["male", "female"],
        locations: [], // To be populated from targetAudience
        interests: [], // To be populated from targetAudience
      };

      // TODO: Transform target audience data into Facebook targeting options
      if (targetAudience) {
        // Example transformation logic, to be developed further
        if (targetAudience.demographics.includes("young")) {
          targeting.ageMin = 18;
          targeting.ageMax = 34;
        } else if (targetAudience.demographics.includes("middle-aged")) {
          targeting.ageMin = 35;
          targeting.ageMax = 54;
        } else if (targetAudience.demographics.includes("older")) {
          targeting.ageMin = 55;
          targeting.ageMax = 65;
        }
      }

      // Create a fake campaign_id for now until we implement the actual API integration
      const fakeCampaignId = `fb_${Math.random().toString(36).substring(2, 15)}`;

      // Store the campaign in our database
      const { error } = await supabase.from("ad_campaigns").insert([{
        project_id: projectId,
        platform: "facebook" as "facebook" | "google" | "linkedin" | "tiktok",
        name: campaignName,
        budget: dailyBudget,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        targeting: {
          dailyBudget,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          objective: "CONVERSIONS",
          ageMin: targeting.ageMin,
          ageMax: targeting.ageMax,
          genders: targeting.genders,
          locations: targeting.locations,
          interests: targeting.interests
        },
        status: "draft",
        platform_campaign_id: fakeCampaignId
      }]);

      if (error) {
        throw error;
      }

      toast({
        title: "Campaign created",
        description: "Your Facebook campaign has been created successfully.",
      });

      if (onSuccess) {
        onSuccess(fakeCampaignId);
      }

      onOpenChange(false);
    } catch (error) {
      console.error("Error creating campaign:", error);
      toast({
        title: "Error",
        description: "Failed to create campaign. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <FaFacebook className="text-[#1877F2] mr-2" />
              Create Facebook Campaign
            </DialogTitle>
            <DialogDescription>
              Configure your campaign settings before publishing to Facebook Ads.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="campaign-name" className="text-right">
                Name
              </Label>
              <Input
                id="campaign-name"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="daily-budget" className="text-right">
                Budget
              </Label>
              <div className="col-span-3 flex items-center">
                <span className="mr-2">$</span>
                <Input
                  id="daily-budget"
                  type="number"
                  min="1"
                  step="1"
                  value={dailyBudget}
                  onChange={(e) => setDailyBudget(parseInt(e.target.value))}
                  className="w-full"
                  required
                />
                <span className="ml-2">per day</span>
              </div>
            </div>
          </div>
          <Separator />
          <DialogFooter className="mt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              variant="facebook"
              disabled={isCreating}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FaFacebook className="mr-2" />
                  Create Campaign
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
