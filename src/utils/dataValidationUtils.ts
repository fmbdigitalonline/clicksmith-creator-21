
import { BusinessIdea, TargetAudience, AudienceAnalysis } from "@/types/adWizard";

export interface ValidationResult {
  isComplete: boolean;
  missingFields: string[];
  warningMessage: string | null;
}

/**
 * Validates business idea data completeness
 */
export function validateBusinessIdea(businessIdea?: BusinessIdea): ValidationResult {
  const missingFields: string[] = [];
  
  if (!businessIdea) {
    return {
      isComplete: false,
      missingFields: ['business idea'],
      warningMessage: "Business idea information is missing"
    };
  }
  
  if (!businessIdea.description || businessIdea.description.trim() === '') {
    missingFields.push('business description');
  }
  
  if (!businessIdea.valueProposition || businessIdea.valueProposition.trim() === '') {
    missingFields.push('value proposition');
  }
  
  return {
    isComplete: missingFields.length === 0,
    missingFields,
    warningMessage: missingFields.length > 0 
      ? `Missing business information: ${missingFields.join(', ')}`
      : null
  };
}

/**
 * Validates target audience data completeness
 */
export function validateTargetAudience(targetAudience?: TargetAudience): ValidationResult {
  const missingFields: string[] = [];
  
  if (!targetAudience) {
    return {
      isComplete: false,
      missingFields: ['target audience'],
      warningMessage: "Target audience information is missing"
    };
  }
  
  const criticalFields: (keyof TargetAudience)[] = [
    'description', 
    'demographics', 
    'painPoints',
    'icp'
  ];
  
  criticalFields.forEach(field => {
    const value = targetAudience[field];
    if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '')) {
      missingFields.push(field);
    }
  });
  
  return {
    isComplete: missingFields.length === 0,
    missingFields,
    warningMessage: missingFields.length > 0 
      ? `Missing audience information: ${missingFields.join(', ')}`
      : null
  };
}

/**
 * Validates audience analysis data completeness
 */
export function validateAudienceAnalysis(audienceAnalysis?: AudienceAnalysis): ValidationResult {
  const missingFields: string[] = [];
  
  if (!audienceAnalysis) {
    return {
      isComplete: false,
      missingFields: ['audience analysis'],
      warningMessage: "Audience analysis information is missing"
    };
  }
  
  const criticalFields: (keyof AudienceAnalysis)[] = [
    'expandedDefinition', 
    'marketDesire', 
    'deepPainPoints'
  ];
  
  criticalFields.forEach(field => {
    const value = audienceAnalysis[field];
    if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '')) {
      missingFields.push(field);
    }
  });
  
  return {
    isComplete: missingFields.length === 0,
    missingFields,
    warningMessage: missingFields.length > 0 
      ? `Missing analysis information: ${missingFields.join(', ')}`
      : null
  };
}

/**
 * Check if format preferences are available and valid
 */
export function validateFormatPreferences(formatPreferences?: string[]): ValidationResult {
  if (!formatPreferences || !Array.isArray(formatPreferences) || formatPreferences.length === 0) {
    return {
      isComplete: false,
      missingFields: ['format preferences'],
      warningMessage: "Ad format preferences are not specified"
    };
  }
  
  return {
    isComplete: true,
    missingFields: [],
    warningMessage: null
  };
}

/**
 * Provide a comprehensive project data validation
 */
export function validateProjectDataCompleteness(
  businessIdea?: BusinessIdea,
  targetAudience?: TargetAudience,
  audienceAnalysis?: AudienceAnalysis,
  formatPreferences?: string[]
): ValidationResult {
  const businessValidation = validateBusinessIdea(businessIdea);
  const audienceValidation = validateTargetAudience(targetAudience);
  const analysisValidation = validateAudienceAnalysis(audienceAnalysis);
  const formatsValidation = validateFormatPreferences(formatPreferences);
  
  const allMissingFields = [
    ...businessValidation.missingFields,
    ...audienceValidation.missingFields,
    ...analysisValidation.missingFields,
    ...formatsValidation.missingFields
  ];
  
  let warningMessage = null;
  if (allMissingFields.length > 0) {
    const criticalCount = allMissingFields.length;
    if (criticalCount > 5) {
      warningMessage = "Significant data is missing. Campaign effectiveness may be limited.";
    } else if (criticalCount > 0) {
      warningMessage = `Some important information is missing (${allMissingFields.join(', ')}). Consider completing your project data.`;
    }
  }
  
  return {
    isComplete: allMissingFields.length === 0,
    missingFields: allMissingFields,
    warningMessage
  };
}

/**
 * Create default business idea when missing
 */
export function createDefaultBusinessIdea(): BusinessIdea {
  return {
    description: "Default business description",
    valueProposition: "Helping customers solve their problems with our solution"
  };
}

/**
 * Create default target audience when missing
 */
export function createDefaultTargetAudience(): TargetAudience {
  return {
    name: "Default Audience",
    description: "General target audience",
    demographics: "Adults 25-65",
    painPoints: ["Need for better solutions", "Time constraints", "Budget limitations"],
    icp: "Individuals or businesses looking for quality solutions",
    coreMessage: "We understand your challenges and offer effective solutions",
    positioning: "Reliable solution provider",
    marketingAngle: "Practical and efficient",
    messagingApproach: "Direct and solution-oriented",
    marketingChannels: ["Online", "Social media"]
  };
}

/**
 * Create default audience analysis when missing
 */
export function createDefaultAudienceAnalysis(): AudienceAnalysis {
  return {
    expandedDefinition: "Individuals and organizations seeking quality solutions to their problems",
    marketDesire: "Looking for reliable, cost-effective solutions that save time and effort",
    awarenessLevel: "Moderate",
    sophisticationLevel: "Average",
    deepPainPoints: ["Frustration with current solutions", "Need for better efficiency", "Cost concerns"],
    potentialObjections: ["Price sensitivity", "Resistance to change"]
  };
}

/**
 * Create default format preferences
 */
export function createDefaultFormatPreferences(): string[] {
  return ["single_image", "carousel", "video"];
}
