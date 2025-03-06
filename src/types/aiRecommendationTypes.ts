
import { SuggestionResponse } from "@/hooks/useAICampaignAssistant";

/**
 * Interface for AI recommendation data in campaigns
 */
export interface AICampaignRecommendation {
  suggestion: string;      // The actual recommendation content
  explanation: string;     // Explanation of the recommendation
  confidence: "high" | "medium" | "low";  // Confidence level of the recommendation
}

/**
 * Maps recommendation format properties to align with SuggestionResponse interface
 * @param recommendation The recommendation object with potentially different property names
 * @returns A properly formatted SuggestionResponse object
 */
export function mapToSuggestionResponse(recommendation: {
  recommendation?: string;
  suggestion?: string;
  explanation: string;
  confidence: "high" | "medium" | "low";
}): SuggestionResponse {
  return {
    suggestion: recommendation.suggestion || recommendation.recommendation || "",
    explanation: recommendation.explanation,
    confidence: recommendation.confidence
  };
}
