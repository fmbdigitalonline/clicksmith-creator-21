
import { supabase } from '@/integrations/supabase/client';
import { AIDecision, AIDecisionMetrics, AIDecisionTable, AIDecisionStatsTable } from '@/types/aiSuggestionTypes';
import { toast } from 'sonner';

/**
 * Logs an AI decision made for a campaign
 */
export async function logAIDecision(decision: AIDecision): Promise<boolean> {
  try {
    // Insert the decision into the ai_campaign_decisions table
    const { error } = await supabase
      .from('ai_campaign_decisions')
      .insert({
        campaign_id: decision.campaign_id,
        decision_type: decision.decision_type,
        decision_value: decision.decision_value,
        confidence: decision.confidence,
        reasoning: decision.reasoning
      } as AIDecisionTable['Insert']); // Using type assertion to match the expected type

    if (error) {
      console.error('Error logging AI decision:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in logAIDecision:', error);
    return false;
  }
}

/**
 * Overrides an existing AI decision
 */
export async function overrideAIDecision(
  id: string,
  override: {
    user_override: string;
    override_reason?: string;
  }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ai_campaign_decisions')
      .update({
        user_override: override.user_override,
        override_reason: override.override_reason
      } as AIDecisionTable['Update']) // Using type assertion to match the expected type
      .eq('id', id);

    if (error) {
      console.error('Error overriding AI decision:', error);
      return false;
    }

    toast.success('Decision override saved');
    return true;
  } catch (error) {
    console.error('Error in overrideAIDecision:', error);
    toast.error('Failed to save override');
    return false;
  }
}

/**
 * Fetches AI decisions for a specific campaign
 */
export async function getAIDecisions(campaignId: string): Promise<AIDecision[]> {
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

    return data as unknown as AIDecision[]; // Type assertion to ensure proper return type
  } catch (error) {
    console.error('Error in getAIDecisions:', error);
    return [];
  }
}

/**
 * Gets metrics about AI decisions for a campaign
 */
export async function getAIDecisionMetrics(campaignId: string): Promise<AIDecisionMetrics | null> {
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

    // Need to explicitly cast the data to the expected structure
    return {
      total_decisions: (data as AIDecisionStatsTable['Row']).total_decisions,
      override_rate: (data as AIDecisionStatsTable['Row']).override_rate,
      by_type: (data as AIDecisionStatsTable['Row']).decisions_by_type,
      by_confidence: (data as AIDecisionStatsTable['Row']).decisions_by_confidence
    };
  } catch (error) {
    console.error('Error in getAIDecisionMetrics:', error);
    return null;
  }
}
