
import { BusinessIdea, TargetAudience, AudienceAnalysis } from "@/types/adWizard";
import { validateBusinessIdea, validateTargetAudience, validateAudienceAnalysis } from "./dataValidationUtils";
import { SuggestionType } from "@/hooks/useAICampaignAssistant";

/**
 * Decision tree structure for campaign setting recommendations
 */
interface DecisionNode {
  id: string;
  condition: (data: any) => boolean;
  recommendation: string | ((data: any) => string);
  confidence: "high" | "medium" | "low";
  explanation: string;
  children?: DecisionNode[];
}

/**
 * Interface for campaign automation settings
 */
export interface AutomatedCampaignSettings {
  objective: string;
  targetingDescription: string;
  budget: number;
  adCount: number;
  safetyChecksPassed: boolean;
  validationIssues: string[];
  confidenceLevel: "high" | "medium" | "low";
  dataCompleteness: number;
}

/**
 * Determines the objective based on business data and stage
 */
const objectiveDecisionTree: DecisionNode[] = [
  {
    id: "new_business",
    condition: (data) => data.businessIdea?.description?.toLowerCase().includes("new") || 
                        data.businessIdea?.description?.toLowerCase().includes("start"),
    recommendation: "AWARENESS",
    confidence: "high",
    explanation: "New businesses typically benefit from awareness campaigns to establish presence"
  },
  {
    id: "service_business",
    condition: (data) => data.businessIdea?.description?.toLowerCase().includes("service"),
    recommendation: "LEADS",
    confidence: "high",
    explanation: "Service businesses often need lead generation to find new clients"
  },
  {
    id: "ecommerce",
    condition: (data) => data.businessIdea?.description?.toLowerCase().includes("shop") || 
                        data.businessIdea?.description?.toLowerCase().includes("store") ||
                        data.businessIdea?.description?.toLowerCase().includes("product"),
    recommendation: "SALES",
    confidence: "high",
    explanation: "E-commerce businesses should focus on driving direct sales"
  },
  {
    id: "content_creator",
    condition: (data) => data.businessIdea?.description?.toLowerCase().includes("content") || 
                        data.businessIdea?.description?.toLowerCase().includes("creator") ||
                        data.businessIdea?.description?.toLowerCase().includes("influencer"),
    recommendation: "ENGAGEMENT",
    confidence: "medium",
    explanation: "Content creators benefit from engagement campaigns to build community"
  },
  {
    id: "default",
    condition: () => true,
    recommendation: "CONVERSIONS",
    confidence: "medium",
    explanation: "Conversion campaigns are a balanced approach for most businesses"
  }
];

/**
 * Determines the budget based on business type and audience
 */
const budgetDecisionTree: DecisionNode[] = [
  {
    id: "high_competition",
    condition: (data) => {
      const description = data.businessIdea?.description?.toLowerCase() || "";
      return description.includes("luxury") || 
             description.includes("finance") || 
             description.includes("real estate");
    },
    recommendation: (data) => data.targetAudience?.demographics?.includes("high income") ? "50" : "35",
    confidence: "medium",
    explanation: "Competitive industries require higher budgets to achieve visibility"
  },
  {
    id: "niche_business",
    condition: (data) => {
      const description = data.businessIdea?.description?.toLowerCase() || "";
      return description.includes("niche") || 
             description.includes("specialized") || 
             description.includes("unique");
    },
    recommendation: "20",
    confidence: "high",
    explanation: "Niche businesses can succeed with targeted spending"
  },
  {
    id: "broad_audience",
    condition: (data) => {
      const audience = data.targetAudience?.description?.toLowerCase() || "";
      return audience.includes("everyone") || 
             audience.includes("all ages") || 
             audience.includes("general public");
    },
    recommendation: "40",
    confidence: "medium",
    explanation: "Broad audiences require higher budgets for effective reach"
  },
  {
    id: "default",
    condition: () => true,
    recommendation: "25",
    confidence: "medium",
    explanation: "This is a balanced starting budget for most campaigns"
  }
];

/**
 * Evaluates data completeness as a percentage
 */
export function evaluateDataCompleteness(
  businessIdea?: BusinessIdea,
  targetAudience?: TargetAudience,
  audienceAnalysis?: AudienceAnalysis
): number {
  const businessValidation = validateBusinessIdea(businessIdea);
  const audienceValidation = validateTargetAudience(targetAudience);
  const analysisValidation = validateAudienceAnalysis(audienceAnalysis);
  
  const totalFields = 
    (businessValidation.missingFields.length + (businessValidation.isComplete ? 2 : 0)) +
    (audienceValidation.missingFields.length + (audienceValidation.isComplete ? 4 : 0)) +
    (analysisValidation.missingFields.length + (analysisValidation.isComplete ? 3 : 0));
  
  const completedFields = 
    (businessValidation.isComplete ? 2 : 0) +
    (audienceValidation.isComplete ? 4 : 0) +
    (analysisValidation.isComplete ? 3 : 0);
  
  return Math.min(100, Math.round((completedFields / Math.max(totalFields, 1)) * 100));
}

/**
 * Traverses a decision tree to get a recommendation
 */
function traverseDecisionTree(tree: DecisionNode[], data: any): { recommendation: string; confidence: "high" | "medium" | "low"; explanation: string } {
  for (const node of tree) {
    if (node.condition(data)) {
      const recommendation = typeof node.recommendation === 'function' 
        ? node.recommendation(data) 
        : node.recommendation;
      
      return {
        recommendation,
        confidence: node.confidence,
        explanation: node.explanation
      };
    }
  }
  
  // Fallback to first node if none match (should never happen as last node has true condition)
  const fallback = tree[tree.length - 1];
  return {
    recommendation: typeof fallback.recommendation === 'function' 
      ? fallback.recommendation(data) 
      : fallback.recommendation,
    confidence: fallback.confidence,
    explanation: fallback.explanation
  };
}

/**
 * Generate targeting description based on audience data
 */
function generateTargetingDescription(
  targetAudience?: TargetAudience,
  audienceAnalysis?: AudienceAnalysis
): { description: string; confidence: "high" | "medium" | "low" } {
  if (!targetAudience) {
    return {
      description: "People interested in our products and services",
      confidence: "low"
    };
  }

  const demographics = targetAudience.demographics || "";
  const painPoints = Array.isArray(targetAudience.painPoints) ? targetAudience.painPoints.join(", ") : "";
  const expandedDefinition = audienceAnalysis?.expandedDefinition || "";
  
  let description = `${demographics} who are ${targetAudience.description}`;
  
  if (painPoints) {
    description += ` and experience challenges like ${painPoints}`;
  }
  
  if (expandedDefinition) {
    description += `. ${expandedDefinition}`;
  }
  
  const confidence = targetAudience.demographics && targetAudience.painPoints ? 
    "high" : (targetAudience.description ? "medium" : "low");
  
  return {
    description,
    confidence
  };
}

/**
 * Verify that automated settings are safe to apply
 */
function performSafetyChecks(settings: Partial<AutomatedCampaignSettings>): { passed: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check budget constraints
  if (Number(settings.budget) > 100) {
    issues.push("Automated budget exceeds safety threshold of $100");
  }
  
  // Check targeting breadth
  if (settings.targetingDescription && settings.targetingDescription.length < 20) {
    issues.push("Targeting description may be too brief for effective audience targeting");
  }
  
  // Check objective validity
  const validObjectives = ["AWARENESS", "TRAFFIC", "ENGAGEMENT", "LEADS", "CONVERSIONS", "SALES"];
  if (settings.objective && !validObjectives.includes(settings.objective)) {
    issues.push(`Invalid objective: ${settings.objective}`);
  }
  
  return {
    passed: issues.length === 0,
    issues
  };
}

/**
 * Function that automatically generates campaign settings based on project data
 */
export function generateAutomatedCampaignSettings(
  businessIdea?: BusinessIdea,
  targetAudience?: TargetAudience,
  audienceAnalysis?: AudienceAnalysis
): AutomatedCampaignSettings {
  // Data for decision trees
  const data = {
    businessIdea,
    targetAudience,
    audienceAnalysis
  };
  
  // Generate objective
  const objectiveResult = traverseDecisionTree(objectiveDecisionTree, data);
  
  // Generate budget
  const budgetResult = traverseDecisionTree(budgetDecisionTree, data);
  
  // Generate targeting
  const targetingResult = generateTargetingDescription(targetAudience, audienceAnalysis);
  
  // Create initial settings
  const settings: AutomatedCampaignSettings = {
    objective: objectiveResult.recommendation,
    targetingDescription: targetingResult.description,
    budget: Number(budgetResult.recommendation),
    adCount: 4, // Default number of ads to create
    safetyChecksPassed: false,
    validationIssues: [],
    confidenceLevel: "medium",
    dataCompleteness: evaluateDataCompleteness(businessIdea, targetAudience, audienceAnalysis)
  };
  
  // Determine overall confidence level
  const confidenceLevels = [
    objectiveResult.confidence, 
    budgetResult.confidence, 
    targetingResult.confidence
  ];
  
  if (confidenceLevels.every(level => level === "high")) {
    settings.confidenceLevel = "high";
  } else if (confidenceLevels.some(level => level === "low")) {
    settings.confidenceLevel = "low";
  }
  
  // Perform safety checks
  const safetyResult = performSafetyChecks(settings);
  settings.safetyChecksPassed = safetyResult.passed;
  settings.validationIssues = safetyResult.issues;
  
  return settings;
}

/**
 * Create an AI suggestion response for specific campaign aspects
 */
export function createAISuggestion(
  type: SuggestionType,
  businessIdea?: BusinessIdea,
  targetAudience?: TargetAudience,
  audienceAnalysis?: AudienceAnalysis
): { suggestion: string; explanation: string; confidence: "high" | "medium" | "low" } {
  const data = { businessIdea, targetAudience, audienceAnalysis };
  
  switch (type) {
    case "objective":
      return traverseDecisionTree(objectiveDecisionTree, data);
      
    case "budget":
      return traverseDecisionTree(budgetDecisionTree, data);
      
    case "targeting":
      const result = generateTargetingDescription(targetAudience, audienceAnalysis);
      return {
        suggestion: result.description,
        confidence: result.confidence,
        explanation: "Generated based on your audience demographics, pain points, and market analysis"
      };
      
    case "performance":
      // Simplified performance prediction based on data completeness
      const completeness = evaluateDataCompleteness(businessIdea, targetAudience, audienceAnalysis);
      let prediction, explanation, confidence;
      
      if (completeness > 80) {
        prediction = "Estimated CTR: 1.8-3.2%, Cost per click: $0.45-$1.20";
        explanation = "Your comprehensive data suggests good campaign performance potential";
        confidence = "high";
      } else if (completeness > 50) {
        prediction = "Estimated CTR: 1.0-2.5%, Cost per click: $0.60-$1.80";
        explanation = "Your data indicates average campaign performance potential";
        confidence = "medium";
      } else {
        prediction = "Estimated CTR: 0.5-1.5%, Cost per click: $0.80-$2.50";
        explanation = "Limited data means performance estimates have lower confidence";
        confidence = "low";
      }
      
      return {
        suggestion: prediction,
        explanation,
        confidence: confidence as "high" | "medium" | "low"
      };
      
    default:
      return {
        suggestion: "No specific suggestion available for this aspect",
        explanation: "Not enough data to provide a tailored recommendation",
        confidence: "low"
      };
  }
}
