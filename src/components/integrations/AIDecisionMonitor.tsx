
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface AIDecisionMonitorProps {
  campaignId?: string;
}

interface AIDecision {
  id: string;
  campaign_id: string;
  decision_type: string;
  decision_value: string;
  confidence: string;
  reasoning: string;
  timestamp: string;
  user_override?: string;
  override_reason?: string;
}

export function AIDecisionMonitor({ campaignId }: AIDecisionMonitorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [decisions, setDecisions] = useState<AIDecision[]>([]);
  const { toast } = useToast();
  const { campaignId: routeCampaignId } = useParams();
  const effectiveCampaignId = campaignId || routeCampaignId;

  // This would be connected to a real table in a full implementation
  // For now, we'll simulate the data
  useEffect(() => {
    const fetchDecisions = async () => {
      if (!effectiveCampaignId) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        // In a full implementation, this would fetch from a real table
        // For demonstration, we'll create sample data based on the campaign
        const { data: campaignData, error: campaignError } = await supabase
          .from('ad_campaigns')
          .select('*')
          .eq('id', effectiveCampaignId)
          .single();
          
        if (campaignError) throw campaignError;
        
        if (campaignData.creation_mode !== 'automatic') {
          setDecisions([]);
          return;
        }
        
        // Generate sample AI decisions based on campaign data
        const sampleDecisions: AIDecision[] = [
          {
            id: '1',
            campaign_id: effectiveCampaignId,
            decision_type: 'budget',
            decision_value: `$${campaignData.budget || 50}`,
            confidence: 'high',
            reasoning: 'Based on your business type and campaign objective, this budget is optimal for initial testing.',
            timestamp: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: '2',
            campaign_id: effectiveCampaignId,
            decision_type: 'targeting',
            decision_value: 'Adults 25-45, Interest in technology',
            confidence: 'medium',
            reasoning: 'Derived from your customer profiles and website visitor data.',
            timestamp: new Date(Date.now() - 3300000).toISOString()
          },
          {
            id: '3',
            campaign_id: effectiveCampaignId,
            decision_type: 'objective',
            decision_value: 'Conversion',
            confidence: 'high',
            reasoning: 'Your product price point and landing page are optimized for direct conversions.',
            timestamp: new Date(Date.now() - 3000000).toISOString()
          },
          {
            id: '4',
            campaign_id: effectiveCampaignId,
            decision_type: 'bidding_strategy',
            decision_value: 'CPC',
            confidence: 'high',
            reasoning: 'This strategy aligns with your objective and provides the best control over spend.',
            timestamp: new Date(Date.now() - 2700000).toISOString(),
            user_override: 'CPA',
            override_reason: 'Testing a new bidding approach'
          }
        ];
        
        setDecisions(sampleDecisions);
      } catch (error) {
        console.error('Error fetching AI decisions:', error);
        toast({
          title: "Failed to load AI decisions",
          description: "Could not retrieve the AI decision history for this campaign",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDecisions();
  }, [effectiveCampaignId]);

  const handleOverride = (decisionId: string) => {
    toast({
      title: "Override option",
      description: "In a full implementation, this would open an override dialog",
    });
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <Badge className="bg-green-100 text-green-800">High Confidence</Badge>;
      case 'medium':
        return <Badge className="bg-amber-100 text-amber-800">Medium Confidence</Badge>;
      case 'low':
        return <Badge className="bg-red-100 text-red-800">Low Confidence</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!effectiveCampaignId) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <AlertCircle className="h-12 w-12 mx-auto text-amber-500 mb-2" />
          <h3 className="text-lg font-medium">No Campaign Selected</h3>
          <p className="text-muted-foreground mt-2">
            Select a campaign to view AI decision history
          </p>
        </CardContent>
      </Card>
    );
  }

  if (decisions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Decision Monitor</CardTitle>
          <CardDescription>
            Track and override automated decisions for your campaign
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-6">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <h3 className="text-lg font-medium">No AI Decisions Available</h3>
          <p className="text-muted-foreground mt-2">
            This campaign wasn't created using the AI-Driven mode
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Decision Monitor</CardTitle>
        <CardDescription>
          Track and override automated decisions for your campaign
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Decision</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {decisions.map((decision) => (
              <TableRow key={decision.id}>
                <TableCell className="font-medium capitalize">{decision.decision_type}</TableCell>
                <TableCell>{decision.decision_value}</TableCell>
                <TableCell>{getConfidenceBadge(decision.confidence)}</TableCell>
                <TableCell>
                  {decision.user_override ? (
                    <div className="flex items-center">
                      <XCircle className="h-4 w-4 text-amber-500 mr-1" />
                      <span className="text-sm">Overridden</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      <span className="text-sm">Applied</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleOverride(decision.id)}
                    disabled={!!decision.user_override}
                  >
                    {decision.user_override ? 'Overridden' : 'Override'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex justify-between bg-slate-50 border-t">
        <div className="text-xs text-muted-foreground">
          Decisions based on campaign data and market analysis
        </div>
        <Button variant="ghost" size="sm" className="text-xs">
          <RotateCcw className="h-3 w-3 mr-1" /> Refresh
        </Button>
      </CardFooter>
    </Card>
  );
}
