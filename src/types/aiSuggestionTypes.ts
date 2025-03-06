
import { SuggestionType } from "@/hooks/useAICampaignAssistant";

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
