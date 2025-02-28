
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { facebookAdsService, FacebookCampaignData } from "@/services/facebookAdsService";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Loader2 } from "lucide-react";
import FacebookConnect from "./FacebookConnect";

interface CreateCampaignProps {
  projectId: string;
  onSuccess?: (campaignId: string) => void;
  businessIdea?: any;
  targetAudience?: any;
}

const CAMPAIGN_OBJECTIVES = [
  { value: "OUTCOME_AWARENESS", label: "Brand Awareness" },
  { value: "OUTCOME_TRAFFIC", label: "Traffic" },
  { value: "OUTCOME_ENGAGEMENT", label: "Engagement" },
  { value: "OUTCOME_LEADS", label: "Lead Generation" },
  { value: "OUTCOME_SALES", label: "Conversions" },
];

const DEFAULT_BUDGET = 10;

const CreateCampaign = ({ projectId, onSuccess, businessIdea, targetAudience }: CreateCampaignProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<FacebookCampaignData>({
    campaignName: "",
    objective: "OUTCOME_AWARENESS",
    status: "PAUSED",
    budget: DEFAULT_BUDGET,
  });
  const { toast } = useToast();

  useEffect(() => {
    checkConnection();
    
    // Generate campaign name from business idea if available
    if (businessIdea?.description) {
      setFormData(prev => ({
        ...prev,
        campaignName: `Campaign for ${businessIdea.description.substring(0, 30)}...`
      }));
    }
  }, [businessIdea]);

  const checkConnection = async () => {
    try {
      setIsLoading(true);
      const connections = await facebookAdsService.getConnections();
      setIsConnected(Array.isArray(connections) && connections.length > 0);
    } catch (error) {
      console.error("Error checking Facebook connection:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "budget" ? parseFloat(value) : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsCreating(true);
      
      // Add targeting data if available
      let finalData = { ...formData };
      if (targetAudience) {
        finalData.targeting = {
          // Basic demographic targeting based on target audience
          interests: []
        };
        
        // Extract age if possible
        const demographics = targetAudience.demographics || "";
        const ageMatch = demographics.match(/(\d+)[\s-]*to[\s-]*(\d+)/i);
        if (ageMatch && ageMatch.length >= 3) {
          finalData.targeting.age_min = parseInt(ageMatch[1], 10);
          finalData.targeting.age_max = parseInt(ageMatch[2], 10);
        }
        
        // Extract interests from pain points
        if (targetAudience.painPoints && Array.isArray(targetAudience.painPoints)) {
          finalData.targeting.interests = targetAudience.painPoints.map((point: string) => ({
            name: point,
            id: point.replace(/\s+/g, '_').toLowerCase()
          }));
        }
      }
      
      const result = await facebookAdsService.createCampaign(projectId, finalData);
      
      toast({
        title: "Campaign created!",
        description: "Your Facebook campaign has been created successfully.",
      });
      
      if (onSuccess && result.campaign && result.campaign.id) {
        onSuccess(result.campaign.id);
      }
    } catch (error) {
      console.error("Error creating Facebook campaign:", error);
      toast({
        title: "Campaign creation failed",
        description: error instanceof Error ? error.message : "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-facebook" />
      </div>
    );
  }

  if (!isConnected) {
    return <FacebookConnect onConnected={() => setIsConnected(true)} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Facebook Ad Campaign</CardTitle>
        <CardDescription>
          Set up a new campaign based on your validated business idea
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="campaignName">Campaign Name</Label>
            <Input
              id="campaignName"
              name="campaignName"
              value={formData.campaignName}
              onChange={handleInputChange}
              placeholder="Enter campaign name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="objective">Campaign Objective</Label>
            <Select
              value={formData.objective}
              onValueChange={(value) => handleSelectChange("objective", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an objective" />
              </SelectTrigger>
              <SelectContent>
                {CAMPAIGN_OBJECTIVES.map((objective) => (
                  <SelectItem key={objective.value} value={objective.value}>
                    {objective.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Daily Budget (USD)</Label>
            <Input
              id="budget"
              name="budget"
              type="number"
              min="1"
              step="0.01"
              value={formData.budget}
              onChange={handleInputChange}
              placeholder="Enter daily budget"
              required
            />
          </div>

          {targetAudience && (
            <div className="bg-muted p-4 rounded-md mt-4">
              <h3 className="font-medium text-sm mb-2">Target Audience from Wizard</h3>
              <p className="text-sm text-muted-foreground mb-1">
                <strong>Demographics:</strong> {targetAudience.demographics}
              </p>
              {targetAudience.painPoints && targetAudience.painPoints.length > 0 && (
                <div className="text-sm">
                  <strong>Interests:</strong>{" "}
                  {targetAudience.painPoints.join(", ")}
                </div>
              )}
            </div>
          )}
        </form>
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleSubmit}
          disabled={isCreating}
          className="w-full bg-facebook hover:bg-facebook/90 text-white"
        >
          {isCreating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Campaign...
            </>
          ) : (
            <>
              Create Campaign
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CreateCampaign;
