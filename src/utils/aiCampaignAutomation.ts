
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

  // Return the recommendation in SuggestionResponse format
  return {
    suggestion: recommendedBudget, 
    explanation: budgetExplanation,
    confidence: confidenceLevel
  };
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
  const { demographics, painPoints, marketingChannels } = targetAudience;
  const { expandedDefinition } = audienceAnalysis || {};

  let targetingRecommendation = "";
  let targetingExplanation = "";
  let confidenceLevel: "high" | "medium" | "low" = "low";

  // Logic to determine targeting based on available data
  if (marketingChannels?.includes("social media")) {
    targetingRecommendation = `Target users on social media platforms focusing on ${demographics || "relevant demographics"}`;
    targetingExplanation = "Social media targeting can be effective based on your audience's platform preferences.";
    confidenceLevel = "medium";
  } else if (painPoints?.length > 0) {
    targetingRecommendation = `Target audiences with pain points around ${painPoints.join(", ")}`;
    targetingExplanation = "Targeting based on specific pain points can increase relevance and engagement.";
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

  // Return the recommendation in SuggestionResponse format
  return {
    suggestion: targetingRecommendation,
    explanation: targetingExplanation,
    confidence: confidenceLevel
  };
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

  // Return the recommendation in SuggestionResponse format
  return {
    suggestion: recommendedObjective,
    explanation: objectiveExplanation,
    confidence: confidenceLevel
  };
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

  // Return the prediction in SuggestionResponse format
  return {
    suggestion: performancePrediction,
    explanation: performanceExplanation,
    confidence: confidenceLevel
  };
}

/**
 * Generates automated campaign settings based on business and audience data
 */
export function generateAutomatedCampaignSettings(
  businessIdea?: BusinessIdea,
  targetAudience?: TargetAudience,
  audienceAnalysis?: AudienceAnalysis
) {
  // Get recommendations from individual functions
  const budgetRecommendation = generateBudgetRecommendation(businessIdea, targetAudience, audienceAnalysis);
  const targetingRecommendation = generateTargetingRecommendation(businessIdea, targetAudience, audienceAnalysis);
  const objectiveRecommendation = generateObjectiveRecommendation(businessIdea, targetAudience, audienceAnalysis);
  
  // Extract relevant data for campaign creation
  const budget = budgetRecommendation.suggestion.replace(/[^\d-]/g, '').split('-')[0]; // Extract first number from budget range
  
  // Create campaign settings
  return {
    name: `${targetAudience?.name || 'Automated'} Campaign`,
    objective: objectiveRecommendation.suggestion,
    budget: parseInt(budget) || 1000,
    targeting: {
      recommendation: targetingRecommendation.suggestion,
      demographics: targetAudience?.demographics || '',
      interests: [],
      locations: []
    },
    recommendations: {
      budget: budgetRecommendation,
      targeting: targetingRecommendation,
      objective: objectiveRecommendation
    },
    confidence: Math.min(
      confidenceToNumber(budgetRecommendation.confidence),
      confidenceToNumber(targetingRecommendation.confidence),
      confidenceToNumber(objectiveRecommendation.confidence)
    ) / 100
  };
}

// Helper function to convert confidence level to number for calculations
function confidenceToNumber(confidence: 'high' | 'medium' | 'low'): number {
  switch (confidence) {
    case 'high': return 90;
    case 'medium': return 70;
    case 'low': return 50;
    default: return 50;
  }
}
