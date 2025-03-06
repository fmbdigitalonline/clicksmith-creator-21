
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams } from "react-router-dom";
import { AIDecisionMonitor } from "./AIDecisionMonitor";
import { AIPerformanceTracker } from "./AIPerformanceTracker";
import { AISuggestionMetrics } from "./AISuggestionMetrics";

interface AutomaticModeMonitoringProps {
  projectId?: string;
  campaignId?: string;
}

export function AutomaticModeMonitoring({ projectId, campaignId }: AutomaticModeMonitoringProps) {
  const [activeTab, setActiveTab] = useState("decisions");
  const { projectId: routeProjectId, campaignId: routeCampaignId } = useParams();
  
  const effectiveProjectId = projectId || routeProjectId;
  const effectiveCampaignId = campaignId || routeCampaignId;

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>AI Campaign Monitoring</CardTitle>
        <CardDescription>
          Track automated decisions, campaign performance and AI suggestion usage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="decisions">AI Decisions</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="suggestions">Suggestion Metrics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="decisions">
            <AIDecisionMonitor campaignId={effectiveCampaignId} />
          </TabsContent>
          
          <TabsContent value="performance">
            <AIPerformanceTracker campaignId={effectiveCampaignId} />
          </TabsContent>
          
          <TabsContent value="suggestions">
            <AISuggestionMetrics projectId={effectiveProjectId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
