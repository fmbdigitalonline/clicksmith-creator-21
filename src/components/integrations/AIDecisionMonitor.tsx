
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { getAIDecisions, overrideAIDecision } from "@/utils/aiDecisionTracking";
import { AIDecision } from "@/types/aiSuggestionTypes";
import { useQuery } from "@tanstack/react-query";

interface AIDecisionMonitorProps {
  campaignId?: string;
}

export function AIDecisionMonitor({ campaignId }: AIDecisionMonitorProps) {
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [selectedDecision, setSelectedDecision] = useState<AIDecision | null>(null);
  const [overrideValue, setOverrideValue] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  
  const { data: decisions = [], isLoading, refetch } = useQuery({
    queryKey: ['ai-decisions', campaignId],
    queryFn: () => campaignId ? getAIDecisions(campaignId) : Promise.resolve([]),
    enabled: !!campaignId
  });

  const handleOpenOverride = (decision: AIDecision) => {
    setSelectedDecision(decision);
    setOverrideValue(decision.decision_value);
    setOverrideReason("");
    setOverrideOpen(true);
  };

  const handleSaveOverride = async () => {
    if (!selectedDecision?.id) return;
    
    const success = await overrideAIDecision(selectedDecision.id, {
      user_override: overrideValue,
      override_reason: overrideReason
    });
    
    if (success) {
      setOverrideOpen(false);
      refetch();
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <Badge className="bg-green-500">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-500">Medium</Badge>;
      case 'low':
        return <Badge className="bg-red-500">Low</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  if (!campaignId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">Select a campaign to view AI decisions</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Decisions</CardTitle>
        <CardDescription>
          Track and manage automated decisions made for this campaign
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <p className="text-muted-foreground">Loading decisions...</p>
          </div>
        ) : decisions.length === 0 ? (
          <div className="text-center p-6 border rounded-md bg-muted/10">
            <p className="text-muted-foreground">No AI decisions have been made for this campaign yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {decisions.map((decision) => (
              <div key={decision.id} className="border rounded-md p-4">
                <div className="flex items-center justify-between">
                  <div className="font-medium">{decision.decision_type}</div>
                  <div className="flex items-center gap-2">
                    {getConfidenceBadge(decision.confidence)}
                    <span className="text-xs text-muted-foreground">
                      {new Date(decision.timestamp || "").toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="font-semibold">Value: </span>
                  <span>{decision.decision_value}</span>
                </div>
                {decision.reasoning && (
                  <div className="mt-1 text-sm text-muted-foreground">
                    <span className="font-semibold">Reasoning: </span>
                    <span>{decision.reasoning}</span>
                  </div>
                )}
                {decision.user_override && (
                  <div className="mt-2 p-2 bg-muted rounded-md">
                    <div className="text-sm font-medium">Overridden: {decision.user_override}</div>
                    {decision.override_reason && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Reason: {decision.override_reason}
                      </div>
                    )}
                  </div>
                )}
                {!decision.user_override && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => handleOpenOverride(decision)}
                  >
                    Override
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Override AI Decision</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="decision-type">Decision Type</Label>
                <Input 
                  id="decision-type" 
                  value={selectedDecision?.decision_type || ""} 
                  disabled 
                />
              </div>
              <div>
                <Label htmlFor="original-value">Original Value</Label>
                <Input 
                  id="original-value" 
                  value={selectedDecision?.decision_value || ""} 
                  disabled 
                />
              </div>
              <div>
                <Label htmlFor="override-value">Override Value</Label>
                <Input 
                  id="override-value" 
                  value={overrideValue} 
                  onChange={(e) => setOverrideValue(e.target.value)} 
                />
              </div>
              <div>
                <Label htmlFor="override-reason">Reason for Override (Optional)</Label>
                <Textarea 
                  id="override-reason" 
                  value={overrideReason} 
                  onChange={(e) => setOverrideReason(e.target.value)} 
                  placeholder="Why are you making this change?"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOverrideOpen(false)}>Cancel</Button>
              <Button onClick={handleSaveOverride}>Save Override</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
