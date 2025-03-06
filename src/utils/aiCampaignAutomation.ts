import { BusinessIdea, TargetAudience, AudienceAnalysis } from "@/types/adWizard";
import { AICampaignRecommendation, mapToSuggestionResponse } from "@/types/aiRecommendationTypes";
import { SuggestionResponse } from "@/hooks/useAICampaignAssistant";

/**
 * Generates budget recommendation based on business and audience data
 */
export function generateBudgetRecommendation(
  businessIdea?: BusinessIdea,
  targetAudience?: TargetAudience,
  audienceAnalysis?: AudienceAnalysis
): SuggestionResponse {
  // Default recommendation if no data is available
  if (!businessIdea || !targetAudience) {
    return {
      suggestion: "Consider starting with a budget of $500-1000 for your first campaign",
      explanation: "Without specific business details, a moderate test budget is recommended to gather initial data.",
      confidence: "low"
    };
  }

  // Extract relevant data
  const { demographics } = targetAudience;
  const { marketDesire, awarenessLevel } = audienceAnalysis || {};

  let recommendedBudget = "";
  let budgetExplanation = "";
  let confidenceLevel: "high" | "medium" | "low" = "low";

  // Logic to determine budget based on available data
  if (demographics?.includes("high-income")) {
    recommendedBudget = "$2000-3000";
    budgetExplanation = "High-income audiences often require a larger budget to effectively reach them.";
    confidenceLevel = "medium";
  } else if (marketDesire === "high" && awarenessLevel === "low") {
    recommendedBudget = "$1500-2500";
    budgetExplanation = "A higher budget is recommended to create awareness in a high-desire market.";
    confidenceLevel = "medium";
  } else {
    recommendedBudget = "$1000-2000";
    budgetExplanation = "A moderate budget is suitable for a general campaign with average market conditions.";
    confidenceLevel = "low";
  }

  // Convert recommendation format to match SuggestionResponse interface
  return mapToSuggestionResponse({
    suggestion: recommendedBudget, 
    explanation: budgetExplanation,
    confidence: confidenceLevel
  });
}

/**
 * Generates targeting recommendation based on business and audience data
 */
export function generateTargetingRecommendation(
  businessIdea?: BusinessIdea,
  targetAudience?: TargetAudience,
  audienceAnalysis?: AudienceAnalysis
): SuggestionResponse {
  // Default recommendation if no data is available
  if (!businessIdea || !targetAudience) {
    return {
      suggestion: "Target based on interests and demographics that match your ideal customer",
      explanation: "Without specific audience details, focus on basic demographic and interest-based targeting.",
      confidence: "low"
    };
  }

  // Extract relevant data
  const { demographics, interests } = targetAudience;
  const { expandedDefinition } = audienceAnalysis || {};

  let targetingRecommendation = "";
  let targetingExplanation = "";
  let confidenceLevel: "high" | "medium" | "low" = "low";

  // Logic to determine targeting based on available data
  if (interests?.length > 0) {
    targetingRecommendation = `Target users interested in ${interests.join(", ")}`;
    targetingExplanation = "Interest-based targeting can help reach users who are already interested in similar topics.";
    confidenceLevel = "medium";
  } else if (demographics?.includes("young adults")) {
    targetingRecommendation = "Target young adults aged 18-25 on social media platforms";
    targetingExplanation = "Young adults are highly active on social media, making it an effective channel for reaching them.";
    confidenceLevel = "medium";
  } else {
    targetingRecommendation = "Focus on broad demographic targeting with a mix of age, gender, and location";
    targetingExplanation = "Broad targeting can help gather initial data and identify potential audience segments.";
    confidenceLevel = "low";
  }

  // Convert recommendation format to match SuggestionResponse interface
  return mapToSuggestionResponse({
    suggestion: targetingRecommendation,
    explanation: targetingExplanation,
    confidence: confidenceLevel
  });
}

/**
 * Generates campaign objective recommendation based on business and audience data
 */
export function generateObjectiveRecommendation(
  businessIdea?: BusinessIdea,
  targetAudience?: TargetAudience,
  audienceAnalysis?: AudienceAnalysis
): SuggestionResponse {
  // Default recommendation if no data is available
  if (!businessIdea || !targetAudience) {
    return {
      suggestion: "Brand Awareness",
      explanation: "Without specific business goals, starting with brand awareness helps establish your presence.",
      confidence: "low"
    };
  }

  // Extract relevant data
  const { coreMessage } = targetAudience;
  const { awarenessLevel } = audienceAnalysis || {};

  let recommendedObjective = "";
  let objectiveExplanation = "";
  let confidenceLevel: "high" | "medium" | "low" = "low";

  // Logic to determine objective based on available data
  if (awarenessLevel === "high") {
    recommendedObjective = "Conversions";
    objectiveExplanation = "Since the audience is already aware, focus on driving conversions and sales.";
    confidenceLevel = "medium";
  } else if (coreMessage?.includes("new product")) {
    recommendedObjective = "Reach";
    objectiveExplanation = "For new products, maximizing reach helps introduce the product to a wider audience.";
    confidenceLevel = "medium";
  } else {
    recommendedObjective = "Brand Awareness";
    objectiveExplanation = "Brand awareness is a good starting point for establishing a presence and building recognition.";
    confidenceLevel = "low";
  }

  // Convert recommendation format to match SuggestionResponse interface
  return mapToSuggestionResponse({
    suggestion: recommendedObjective,
    explanation: objectiveExplanation,
    confidence: confidenceLevel
  });
}

/**
 * Predicts campaign performance based on all available data
 */
export function predictCampaignPerformance(
  businessIdea?: BusinessIdea,
  targetAudience?: TargetAudience,
  audienceAnalysis?: AudienceAnalysis,
  budget?: number
): SuggestionResponse {
  // Default prediction if no data is available
  if (!businessIdea || !targetAudience || !budget) {
    return {
      suggestion: "Estimated 100-300 clicks with a CPC of $1.50-3.00",
      explanation: "This is a rough estimate without specific campaign details. Actual results may vary.",
      confidence: "low"
    };
  }

  // Extract relevant data
  const { demographics } = targetAudience;
  const { marketDesire, awarenessLevel } = audienceAnalysis || {};

  let performancePrediction = "";
  let performanceExplanation = "";
  let confidenceLevel: "high" | "medium" | "low" = "low";

  // Logic to predict performance based on available data
  if (demographics?.includes("high-income") && budget > 2000) {
    performancePrediction = "Estimated 500-800 clicks with a CPC of $2.00-3.50";
    performanceExplanation = "High-income audiences and a larger budget can lead to better performance.";
    confidenceLevel = "medium";
  } else if (marketDesire === "high" && awarenessLevel === "low") {
    performancePrediction = "Estimated 300-500 clicks with a CPC of $1.75-3.25";
    performanceExplanation = "A high-desire market may result in better click-through rates despite low awareness.";
    confidenceLevel = "medium";
  } else {
    performancePrediction = "Estimated 200-400 clicks with a CPC of $1.50-3.00";
    performanceExplanation = "This is a general estimate based on average market conditions and a moderate budget.";
    confidenceLevel = "low";
  }

  // Convert recommendation format to match SuggestionResponse interface
  return mapToSuggestionResponse({
    suggestion: performancePrediction,
    explanation: performanceExplanation,
    confidence: confidenceLevel
  });
}
