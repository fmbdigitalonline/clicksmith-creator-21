
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { generateAutomatedCampaignSettings } from "@/utils/aiCampaignAutomation";
import { BusinessIdea, TargetAudience, AudienceAnalysis } from "@/types/adWizard";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, CheckCircle, CheckCheck, Lightbulb, Edit, Settings, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { AISuggestion } from "./AISuggestion";

interface AutomatedCampaignSummaryProps {
  businessIdea?: BusinessIdea;
  targetAudience?: TargetAudience;
  audienceAnalysis?: AudienceAnalysis;
  projectId?: string;
  onApprove: (settings: any) => void;
  onEdit: () => void;
  loading?: boolean;
}

export default function AutomatedCampaignSummary({
  businessIdea,
  targetAudience,
  audienceAnalysis,
  projectId,
  onApprove,
  onEdit,
  loading = false
}: AutomatedCampaignSummaryProps) {
  const [settings, setSettings] = useState<any>(null);
  const [processingStatus, setProcessingStatus] = useState<string>("Analyzing project data...");
  const [processingStep, setProcessingStep] = useState<number>(0);
  const [overallConfidence, setOverallConfidence] = useState<"high" | "medium" | "low">("medium");
  
  useEffect(() => {
    // Simulated AI processing with steps for better UX
    if (loading) {
      const steps = [
        "Analyzing project data...",
        "Evaluating audience characteristics...",
        "Determining optimal budget...",
        "Generating targeting parameters...",
        "Applying decision algorithms...",
        "Finalizing campaign recommendations..."
      ];
      
      let currentStep = 0;
      const interval = setInterval(() => {
        setProcessingStep(currentStep);
        setProcessingStatus(steps[currentStep]);
        currentStep++;
        
        if (currentStep >= steps.length) {
          clearInterval(interval);
          
          // Generate actual settings after simulation completes
          const generatedSettings = generateAutomatedCampaignSettings(
            businessIdea,
            targetAudience,
            audienceAnalysis
          );
          
          setSettings(generatedSettings);
          setOverallConfidence(generatedSettings.confidenceLevel);
        }
      }, 1000);
      
      return () => clearInterval(interval);
    } else if (!settings) {
      // Generate settings immediately if not loading
      const generatedSettings = generateAutomatedCampaignSettings(
        businessIdea,
        targetAudience,
        audienceAnalysis
      );
      
      setSettings(generatedSettings);
      setOverallConfidence(generatedSettings.confidenceLevel);
    }
  }, [businessIdea, targetAudience, audienceAnalysis, loading]);
  
  const renderConfidenceBadge = (confidence: "high" | "medium" | "low") => {
    switch (confidence) {
      case "high":
        return (
          <div className="flex items-center text-green-600 text-sm font-medium">
            <CheckCheck className="h-4 w-4 mr-1" />
            High confidence
          </div>
        );
      case "medium":
        return (
          <div className="flex items-center text-amber-600 text-sm font-medium">
            <CheckCircle className="h-4 w-4 mr-1" />
            Medium confidence
          </div>
        );
      case "low":
        return (
          <div className="flex items-center text-red-600 text-sm font-medium">
            <AlertCircle className="h-4 w-4 mr-1" />
            Low confidence
          </div>
        );
    }
  };
  
  if (loading || !settings) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>AI Campaign Analysis</CardTitle>
          <CardDescription>
            Our AI is analyzing your project data to create the optimal campaign
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium">{processingStatus}</div>
            <div className="text-sm text-muted-foreground">
              Step {processingStep + 1}/6
            </div>
          </div>
          <Progress value={(processingStep + 1) * 16.66} className="h-2" />
          <div className="flex justify-center mt-6">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>AI Campaign Recommendations</CardTitle>
            <CardDescription>
              Based on your project data, our AI has created these campaign settings
            </CardDescription>
          </div>
          {renderConfidenceBadge(overallConfidence)}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Data completeness indicator */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium">Data completeness</div>
            <div className="text-sm text-muted-foreground">
              {settings.dataCompleteness}%
            </div>
          </div>
          <Progress value={settings.dataCompleteness} className="h-2" />
          {settings.dataCompleteness < 70 && (
            <div className="flex items-start p-3 bg-amber-50 rounded border border-amber-100 mt-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-xs text-amber-800">
                Limited project data available. Consider adding more information to your project for better AI suggestions.
              </div>
            </div>
          )}
        </div>
        
        {/* Campaign objective */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Campaign Objective</h3>
          <div className="flex items-start justify-between p-3 bg-gray-50 rounded border">
            <div className="space-y-1">
              <p className="font-semibold">{settings.objective}</p>
              <p className="text-xs text-gray-600">Determined based on your business type and goals</p>
            </div>
            <AISuggestion 
              type="objective"
              size="sm"
              businessIdea={businessIdea}
              targetAudience={targetAudience}
              projectId={projectId}
            />
          </div>
        </div>
        
        {/* Budget recommendation */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Daily Budget</h3>
          <div className="flex items-start justify-between p-3 bg-gray-50 rounded border">
            <div className="space-y-1">
              <p className="font-semibold">${settings.budget}</p>
              <p className="text-xs text-gray-600">Optimized for your business type and audience</p>
            </div>
            <AISuggestion 
              type="budget"
              size="sm"
              businessIdea={businessIdea}
              targetAudience={targetAudience}
              projectId={projectId}
              currentValue={settings.budget}
            />
          </div>
        </div>
        
        {/* Targeting */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Audience Targeting</h3>
          <div className="flex items-start justify-between p-3 bg-gray-50 rounded border">
            <div className="space-y-1">
              <p className="text-sm">{settings.targetingDescription}</p>
            </div>
            <AISuggestion 
              type="targeting"
              size="sm"
              businessIdea={businessIdea}
              targetAudience={targetAudience}
              audienceAnalysis={audienceAnalysis}
              projectId={projectId}
            />
          </div>
        </div>
        
        {/* Performance prediction */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Performance Prediction</h3>
          <div className="p-3 bg-gray-50 rounded border">
            <AISuggestion 
              type="performance"
              businessIdea={businessIdea}
              targetAudience={targetAudience}
              audienceAnalysis={audienceAnalysis}
              projectId={projectId}
            />
          </div>
        </div>
        
        {/* Safety warnings */}
        {!settings.safetyChecksPassed && settings.validationIssues.length > 0 && (
          <div className="p-3 bg-red-50 rounded border border-red-100">
            <div className="flex items-start">
              <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Safety Warnings</h4>
                <ul className="text-xs text-red-700 mt-1 list-disc list-inside">
                  {settings.validationIssues.map((issue: string, index: number) => (
                    <li key={index}>{issue}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {/* AI explainer */}
        <div className="flex items-start p-3 bg-purple-50 rounded border border-purple-100">
          <Lightbulb className="h-4 w-4 text-purple-600 mt-0.5 mr-2 flex-shrink-0" />
          <p className="text-xs text-purple-800">
            These recommendations are generated using specialized decision trees and algorithms that analyze your business data and apply industry best practices. You can modify any setting after approving.
          </p>
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-between pt-2">
          <Button
            variant="outline"
            onClick={onEdit}
            className="flex items-center"
          >
            <Edit className="h-4 w-4 mr-2" />
            Customize
          </Button>
          <Button
            onClick={() => onApprove(settings)}
            className="flex items-center bg-purple-600 hover:bg-purple-700"
          >
            <CheckCheck className="h-4 w-4 mr-2" />
            Apply Recommendations
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
