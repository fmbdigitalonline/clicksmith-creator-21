
import { supabase } from "@/integrations/supabase/client";
import { SuggestionType } from "@/hooks/useAICampaignAssistant";
import { AISuggestionFeedback } from "@/types/aiSuggestionTypes";

/**
 * Logs AI suggestion feedback to the database
 */
export async function logSuggestionFeedback(
  suggestion: {
    type: SuggestionType;
    content: string;
    confidence?: "high" | "medium" | "low";
  },
  action: "applied" | "helpful" | "unhelpful" | "dismissed",
  projectId: string,
  currentValue?: string
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user || !projectId) {
      console.warn('Missing user or project ID for suggestion feedback');
      return false;
    }
    
    // Create feedback data
    const feedbackData: AISuggestionFeedback = {
      user_id: user.id,
      project_id: projectId,
      suggestion_type: suggestion.type,
      action,
      suggestion_content: suggestion.content,
      suggestion_confidence: suggestion.confidence,
      current_value: currentValue
    };
    
    const { error } = await supabase
      .from('ai_suggestion_feedback')
      .insert(feedbackData);
    
    if (error) {
      console.error('Error logging suggestion feedback:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in logSuggestionFeedback:', error);
    return false;
  }
}
