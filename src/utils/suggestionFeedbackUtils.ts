
import { supabase } from "@/integrations/supabase/client";
import { SuggestionType } from "@/hooks/useAICampaignAssistant";
import { AISuggestionFeedback } from "@/types/aiSuggestionTypes";

/**
 * Logs a user interaction with an AI suggestion
 * 
 * @param userId - The user's ID
 * @param projectId - The project ID
 * @param suggestionType - The type of suggestion (targeting, budget, etc.)
 * @param action - The action taken (applied, helpful, unhelpful, dismissed)
 * @param suggestionContent - The content of the suggestion
 * @param suggestionConfidence - The confidence level of the suggestion
 * @param currentValue - The current value before the suggestion
 * @returns Whether the logging was successful
 */
export async function logSuggestionFeedback(
  userId: string,
  projectId: string,
  suggestionType: SuggestionType,
  action: "applied" | "helpful" | "unhelpful" | "dismissed",
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
    
    // Insert feedback into Supabase
    const { error } = await supabase
      .from('ai_suggestion_feedback')
      .insert(feedbackData);
    
    if (error) {
      console.error('Error logging suggestion feedback:', error);
      return false;
    }
    
    console.log(`Suggestion ${action} logged successfully`);
    return true;
  } catch (error) {
    console.error('Error in logSuggestionFeedback:', error);
    return false;
  }
}

/**
 * Get suggestion feedback statistics for a specific user and project
 * 
 * @param userId - The user's ID
 * @param projectId - Optional project ID to filter by
 * @returns Feedback statistics
 */
export async function getSuggestionFeedbackStats(
  userId: string,
  projectId?: string
) {
  try {
    let query = supabase
      .from('ai_suggestion_feedback')
      .select('suggestion_type, action, count(*)')
      .eq('user_id', userId);
    
    if (projectId) {
      query = query.eq('project_id', projectId);
    }
    
    // Group by suggestion type and action
    query = query.group_by('suggestion_type, action');
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching suggestion feedback stats:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error in getSuggestionFeedbackStats:', error);
    return null;
  }
}
