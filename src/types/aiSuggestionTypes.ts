
import { SuggestionType } from "@/hooks/useAICampaignAssistant";

/**
 * Interface for AI suggestion feedback data.
 * Maps to the ai_suggestion_feedback table in Supabase.
 */
export interface AISuggestionFeedback {
  id?: string;
  user_id: string;
  project_id: string;
  suggestion_type: SuggestionType;
  action: "applied" | "helpful" | "unhelpful" | "dismissed";
  suggestion_content?: string;
  suggestion_confidence?: "high" | "medium" | "low";
  current_value?: string;
  created_at?: string;
}

/**
 * Structure of the ai_suggestion_feedback table in Supabase.
 * This can be used for type assertions until Supabase types are regenerated.
 */
export interface AISuggestionFeedbackTable {
  Row: AISuggestionFeedback;
  Insert: Omit<AISuggestionFeedback, 'id' | 'created_at'>;
  Update: Partial<Omit<AISuggestionFeedback, 'id' | 'created_at'>>;
}

/**
 * Interface for AI decision data to track automated campaign decisions
 */
export interface AIDecision {
  id?: string;
  campaign_id: string;
  decision_type: string;
  decision_value: string;
  confidence: "high" | "medium" | "low";
  reasoning: string;
  timestamp?: string;
  user_override?: string;
  override_reason?: string;
}

/**
 * Structure of metrics tracked for AI campaign decisions 
 */
export interface AIDecisionMetrics {
  total_decisions: number;
  override_rate: number;
  by_type: Record<string, number>;
  by_confidence: {
    high: number;
    medium: number;
    low: number;
  };
}
