
import { SuggestionResponse } from "@/hooks/useAICampaignAssistant";

/**
 * Interface for AI campaign recommendations
 */
export interface AICampaignRecommendation {
  recommendation: string;
  explanation: string;
  confidence: "high" | "medium" | "low";
}

/**
 * Maps a recommendation to the suggestion response format
 */
export function mapToSuggestionResponse(recommendation: AICampaignRecommendation): SuggestionResponse {
  return {
    suggestion: recommendation.recommendation,
    explanation: recommendation.explanation,
    confidence: recommendation.confidence
  };
}
