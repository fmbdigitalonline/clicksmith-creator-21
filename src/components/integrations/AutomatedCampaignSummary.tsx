
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateAutomatedCampaignSettings } from "@/utils/aiCampaignAutomation";
import { BusinessIdea, TargetAudience, AudienceAnalysis } from "@/types/adWizard";
import { Badge } from "@/components/ui/badge";
import { CircleCheck, CircleDashed, ArrowRightCircle, AlertCircle, Check } from "lucide-react";
import { useState } from "react";
import { AISuggestion } from "./AISuggestion";

interface AutomatedCampaignSummaryProps {
  businessIdea?: BusinessIdea;
  targetAudience?: TargetAudience;
  audienceAnalysis?: AudienceAnalysis;
  projectId?: string;
  onConfirm: (settings: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function AutomatedCampaignSummary({
  businessIdea,
  targetAudience,
  audienceAnalysis,
  projectId,
  onConfirm,
  onCancel,
  loading = false
}: AutomatedCampaignSummaryProps) {
  const [campaignSettings, setCampaignSettings] = useState(() => 
    generateAutomatedCampaignSettings(businessIdea, targetAudience, audienceAnalysis)
  );
  
  const [customizedSettings, setCustomizedSettings] = useState(campaignSettings);
  const [isReviewing, setIsReviewing] = useState(true);
  
  const handleUpdateSetting = (key: string, value: any) => {
    setCustomizedSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handleTargetingSuggestion = (suggestion: string) => {
    setCustomizedSettings(prev => ({
      ...prev,
      targeting: {
        ...prev.targeting,
        recommendation: suggestion
      }
    }));
  };
  
  const handleObjectiveSuggestion = (suggestion: string) => {
    setCustomizedSettings(prev => ({
      ...prev,
      objective: suggestion
    }));
  };
  
  const handleBudgetSuggestion = (suggestion: string) => {
    // Extract number from suggestion (e.g., "$1000-2000" -> 1000)
    const budget = parseInt(suggestion.replace(/[^\d-]/g, '').split('-')[0]) || 1000;
    
    setCustomizedSettings(prev => ({
      ...prev,
      budget: budget
    }));
  };
  
  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) {
      return <Badge className="bg-green-600">High Confidence</Badge>;
    } else if (confidence >= 0.6) {
      return <Badge className="bg-yellow-600">Medium Confidence</Badge>;
    } else {
      return <Badge className="bg-red-600">Low Confidence</Badge>;
    }
  };
  
  const handleConfirmSettings = () => {
    onConfirm(customizedSettings);
  };
  
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold">AI Campaign Recommendation</h2>
          <p className="text-muted-foreground">
            Our AI has analyzed your business and audience data to create an optimized campaign
          </p>
        </div>
        {getConfidenceBadge(campaignSettings.confidence)}
      </div>
      
      {isReviewing ? (
        <div className="space-y-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <CircleCheck className="mr-2 h-5 w-5 text-green-600" />
                Campaign Objective
              </CardTitle>
              <CardDescription>The recommended goal for your campaign</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="p-4 bg-gray-50 rounded-md mb-2">
                <p className="font-medium">{campaignSettings.objective}</p>
                <p className="text-sm text-muted-foreground">
                  {campaignSettings.recommendations.objective.explanation}
                </p>
              </div>
              
              <div className="mt-4">
                <AISuggestion
                  type="objective"
                  businessIdea={businessIdea}
                  targetAudience={targetAudience}
                  audienceAnalysis={audienceAnalysis}
                  projectId={projectId}
                  currentValue={campaignSettings.objective}
                  onSuggestionSelected={handleObjectiveSuggestion}
                  size="sm"
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <CircleCheck className="mr-2 h-5 w-5 text-green-600" />
                Campaign Budget
              </CardTitle>
              <CardDescription>Recommended budget allocation</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="p-4 bg-gray-50 rounded-md mb-2">
                <p className="font-medium">${campaignSettings.budget}</p>
                <p className="text-sm text-muted-foreground">
                  {campaignSettings.recommendations.budget.explanation}
                </p>
              </div>
              
              <div className="mt-4">
                <AISuggestion
                  type="budget"
                  businessIdea={businessIdea}
                  targetAudience={targetAudience}
                  audienceAnalysis={audienceAnalysis}
                  projectId={projectId}
                  currentValue={campaignSettings.budget.toString()}
                  onSuggestionSelected={handleBudgetSuggestion}
                  size="sm"
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-lg">
                <CircleCheck className="mr-2 h-5 w-5 text-green-600" />
                Audience Targeting
              </CardTitle>
              <CardDescription>Who your campaign will reach</CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="p-4 bg-gray-50 rounded-md mb-2">
                <p className="font-medium">{campaignSettings.targeting.recommendation}</p>
                <p className="text-sm text-muted-foreground">
                  {campaignSettings.recommendations.targeting.explanation}
                </p>
              </div>
              
              <div className="mt-4">
                <AISuggestion
                  type="targeting"
                  businessIdea={businessIdea}
                  targetAudience={targetAudience}
                  audienceAnalysis={audienceAnalysis}
                  projectId={projectId}
                  currentValue={campaignSettings.targeting.recommendation}
                  onSuggestionSelected={handleTargetingSuggestion}
                  size="sm"
                />
              </div>
            </CardContent>
          </Card>
          
          <div className="flex justify-between pt-4 mt-6 border-t">
            <Button 
              variant="outline" 
              onClick={onCancel}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmSettings}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {loading ? (
                <>Creating Campaign...</>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" /> 
                  Confirm & Create Campaign
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="p-6 text-center border rounded-md">
          <p>Customization interface would go here</p>
          <Button className="mt-4" onClick={() => setIsReviewing(true)}>
            Return to Review
          </Button>
        </div>
      )}
    </div>
  );
}
