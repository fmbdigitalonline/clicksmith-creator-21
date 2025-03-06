
import { supabase } from "@/integrations/supabase/client";
import { AIDecision, AIDecisionMetrics } from "@/types/aiSuggestionTypes";
import { useToast } from "@/components/ui/use-toast";

/**
 * Records an AI-made decision for a campaign
 * @param decision The decision data to record
 * @returns Promise resolving to success status
 */
export const recordAIDecision = async (decision: AIDecision): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('ai_campaign_decisions')
      .insert({
        campaign_id: decision.campaign_id,
        decision_type: decision.decision_type,
        decision_value: decision.decision_value,
        confidence: decision.confidence,
        reasoning: decision.reasoning,
        // Timestamp will be set by the database
      });
      
    if (error) {
      console.error('Error recording AI decision:', error);
      return false;
    }
    
    console.log('AI decision recorded successfully');
    return true;
  } catch (error) {
    console.error('Error recording AI decision:', error);
    return false;
  }
};

/**
 * Overrides an existing AI decision with user input
 * @param decisionId The ID of the decision to override
 * @param overrideValue The user's override value
 * @param overrideReason The reason for the override
 * @returns Promise resolving to success status
 */
export const overrideAIDecision = async (
  decisionId: string,
  overrideValue: string,
  overrideReason: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('ai_campaign_decisions')
      .update({
        user_override: overrideValue,
        override_reason: overrideReason
      })
      .eq('id', decisionId);
      
    if (error) {
      console.error('Error overriding AI decision:', error);
      return false;
    }
    
    console.log('AI decision override recorded successfully');
    return true;
  } catch (error) {
    console.error('Error overriding AI decision:', error);
    return false;
  }
};

/**
 * Retrieves all AI decisions for a campaign
 * @param campaignId The campaign ID to fetch decisions for
 * @returns Promise resolving to an array of decisions
 */
export const getAIDecisions = async (campaignId: string): Promise<AIDecision[]> => {
  try {
    const { data, error } = await supabase
      .from('ai_campaign_decisions')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('timestamp', { ascending: false });
      
    if (error) {
      console.error('Error fetching AI decisions:', error);
      return [];
    }
    
    return data as AIDecision[];
  } catch (error) {
    console.error('Error fetching AI decisions:', error);
    return [];
  }
};

/**
 * Gets decision metrics for a campaign
 * @param campaignId The campaign ID to fetch metrics for
 * @returns Promise resolving to decision metrics
 */
export const getAIDecisionMetrics = async (campaignId: string): Promise<AIDecisionMetrics | null> => {
  try {
    const { data, error } = await supabase
      .from('ai_decision_stats')
      .select('*')
      .eq('campaign_id', campaignId)
      .single();
      
    if (error) {
      console.error('Error fetching AI decision metrics:', error);
      return null;
    }
    
    if (!data) return null;
    
    // Transform data to match our interface
    return {
      total_decisions: data.total_decisions,
      override_rate: data.override_rate,
      by_type: data.decisions_by_type,
      by_confidence: data.decisions_by_confidence
    };
  } catch (error) {
    console.error('Error fetching AI decision metrics:', error);
    return null;
  }
};

/**
 * React hook for tracking AI decisions
 * @returns Functions for working with AI decisions
 */
export const useAIDecisionTracking = () => {
  const { toast } = useToast();
  
  const recordDecision = async (decision: AIDecision): Promise<boolean> => {
    const result = await recordAIDecision(decision);
    
    if (!result) {
      toast({
        title: "Error",
        description: "Failed to record AI decision",
        variant: "destructive"
      });
    }
    
    return result;
  };
  
  const applyOverride = async (
    decisionId: string,
    overrideValue: string,
    overrideReason: string
  ): Promise<boolean> => {
    const result = await overrideAIDecision(decisionId, overrideValue, overrideReason);
    
    if (result) {
      toast({
        title: "Override Applied",
        description: "Your override has been applied successfully"
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to apply override",
        variant: "destructive"
      });
    }
    
    return result;
  };
  
  return {
    recordDecision,
    applyOverride,
    getDecisions: getAIDecisions,
    getMetrics: getAIDecisionMetrics
  };
};
