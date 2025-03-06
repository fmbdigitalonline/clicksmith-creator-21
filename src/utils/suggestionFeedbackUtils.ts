
import { supabase } from "@/integrations/supabase/client";
import { AISuggestionFeedback } from "@/types/aiSuggestionTypes";
import { SuggestionType } from "@/hooks/useAICampaignAssistant";

/**
 * Logs AI suggestion interaction to the database
 */
export async function logSuggestionInteraction(
  userId: string,
  projectId: string,
  suggestionType: SuggestionType,
  action: 'applied' | 'helpful' | 'unhelpful' | 'dismissed',
  suggestionContent?: string,
  suggestionConfidence?: "high" | "medium" | "low",
  currentValue?: string
): Promise<boolean> {
  try {
    // Create feedback data with proper typing
    const feedbackData: AISuggestionFeedback = {
      user_id: userId,
      project_id: projectId,
      suggestion_type: suggestionType,
      action,
      suggestion_content: suggestionContent,
      suggestion_confidence: suggestionConfidence,
      current_value: currentValue
    };
    
    // Use proper typings when interacting with Supabase
    const { error } = await supabase
      .from('ai_suggestion_feedback')
      .insert(feedbackData);
    
    if (error) {
      console.error('Error logging suggestion interaction:', error);
      return false;
    }
    
    console.log(`Suggestion ${action} logged successfully`);
    return true;
  } catch (error) {
    console.error('Error logging suggestion interaction:', error);
    return false;
  }
}

/**
 * Gets suggestion effectiveness stats for a project
 */
export async function getSuggestionEffectiveness(
  projectId: string
): Promise<{ totalSuggestions: number, appliedRate: number, helpfulRate: number }> {
  try {
    // Get total suggestions count
    const { data: totalData, error: totalError } = await supabase
      .from('ai_suggestion_feedback')
      .select('id')
      .eq('project_id', projectId);
    
    if (totalError) {
      console.error('Error getting suggestion stats:', totalError);
      return { totalSuggestions: 0, appliedRate: 0, helpfulRate: 0 };
    }
    
    const totalSuggestions = totalData?.length || 0;
    
    // Get count of applied suggestions
    const { data: appliedData, error: appliedError } = await supabase
      .from('ai_suggestion_feedback')
      .select('id')
      .eq('project_id', projectId)
      .eq('action', 'applied');
    
    if (appliedError) {
      console.error('Error getting applied suggestions:', appliedError);
      return { totalSuggestions, appliedRate: 0, helpfulRate: 0 };
    }
    
    // Get count of helpful suggestions
    const { data: helpfulData, error: helpfulError } = await supabase
      .from('ai_suggestion_feedback')
      .select('id')
      .eq('project_id', projectId)
      .eq('action', 'helpful');
    
    if (helpfulError) {
      console.error('Error getting helpful suggestions:', helpfulError);
      return { totalSuggestions, appliedRate: 0, helpfulRate: 0 };
    }
    
    const appliedCount = appliedData?.length || 0;
    const helpfulCount = helpfulData?.length || 0;
    
    const appliedRate = totalSuggestions > 0 ? (appliedCount / totalSuggestions) * 100 : 0;
    const helpfulRate = totalSuggestions > 0 ? (helpfulCount / totalSuggestions) * 100 : 0;
    
    return { totalSuggestions, appliedRate, helpfulRate };
  } catch (error) {
    console.error('Error getting suggestion effectiveness:', error);
    return { totalSuggestions: 0, appliedRate: 0, helpfulRate: 0 };
  }
}

/**
 * Gets suggestion effectiveness by type
 */
export async function getSuggestionTypeBreakdown(
  userId: string
): Promise<Record<SuggestionType, { totalSuggestions: number, appliedRate: number, helpfulRate: number }>> {
  try {
    // Get all suggestions for user
    const { data: suggestions, error } = await supabase
      .from('ai_suggestion_feedback')
      .select('suggestion_type, action')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error getting suggestion type breakdown:', error);
      return {
        targeting: { totalSuggestions: 0, appliedRate: 0, helpfulRate: 0 },
        budget: { totalSuggestions: 0, appliedRate: 0, helpfulRate: 0 },
        objective: { totalSuggestions: 0, appliedRate: 0, helpfulRate: 0 },
        performance: { totalSuggestions: 0, appliedRate: 0, helpfulRate: 0 }
      };
    }
    
    // Process data to calculate metrics for each type
    const result: Record<SuggestionType, { totalSuggestions: number, appliedRate: number, helpfulRate: number }> = {
      targeting: { totalSuggestions: 0, appliedRate: 0, helpfulRate: 0 },
      budget: { totalSuggestions: 0, appliedRate: 0, helpfulRate: 0 },
      objective: { totalSuggestions: 0, appliedRate: 0, helpfulRate: 0 },
      performance: { totalSuggestions: 0, appliedRate: 0, helpfulRate: 0 }
    };
    
    // Count totals and actions by type
    const typeCounts: Record<SuggestionType, { total: number, applied: number, helpful: number }> = {
      targeting: { total: 0, applied: 0, helpful: 0 },
      budget: { total: 0, applied: 0, helpful: 0 },
      objective: { total: 0, applied: 0, helpful: 0 },
      performance: { total: 0, applied: 0, helpful: 0 }
    };
    
    suggestions?.forEach(suggestion => {
      const type = suggestion.suggestion_type as SuggestionType;
      const action = suggestion.action;
      
      if (typeCounts[type]) {
        typeCounts[type].total++;
        
        if (action === 'applied') {
          typeCounts[type].applied++;
        } else if (action === 'helpful') {
          typeCounts[type].helpful++;
        }
      }
    });
    
    // Calculate rates
    Object.keys(typeCounts).forEach(type => {
      const typeKey = type as SuggestionType;
      const counts = typeCounts[typeKey];
      
      result[typeKey] = {
        totalSuggestions: counts.total,
        appliedRate: counts.total > 0 ? (counts.applied / counts.total) * 100 : 0,
        helpfulRate: counts.total > 0 ? (counts.helpful / counts.total) * 100 : 0
      };
    });
    
    return result;
  } catch (error) {
    console.error('Error getting suggestion type breakdown:', error);
    return {
      targeting: { totalSuggestions: 0, appliedRate: 0, helpfulRate: 0 },
      budget: { totalSuggestions: 0, appliedRate: 0, helpfulRate: 0 },
      objective: { totalSuggestions: 0, appliedRate: 0, helpfulRate: 0 },
      performance: { totalSuggestions: 0, appliedRate: 0, helpfulRate: 0 }
    };
  }
}
