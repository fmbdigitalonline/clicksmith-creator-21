
import { BusinessIdea, TargetAudience, AudienceAnalysis } from "@/types/adWizard";

/**
 * Generate a campaign name from business idea
 */
export function generateCampaignName(businessIdea?: BusinessIdea): string {
  if (!businessIdea?.description) return "New Facebook Campaign";
  
  // Extract key terms from business description
  const description = businessIdea.description;
  const words = description.split(' ');
  const keyTerms = words
    .filter(word => word.length > 3)
    .filter(word => !['with', 'that', 'this', 'from', 'your'].includes(word.toLowerCase()))
    .slice(0, 2);
  
  // If we couldn't extract meaningful terms, use a generic name
  if (keyTerms.length === 0) return "Facebook Campaign";
  
  // Format the campaign name
  const keyPhrase = keyTerms.map(term => term.charAt(0).toUpperCase() + term.slice(1).toLowerCase()).join(' ');
  return `${keyPhrase} Campaign`;
}

/**
 * Generate campaign description from value proposition
 */
export function generateCampaignDescription(businessIdea?: BusinessIdea): string {
  if (!businessIdea?.valueProposition) return "Facebook ad campaign targeting our ideal customers.";
  return businessIdea.valueProposition;
}

/**
 * Extract demographic data for targeting
 */
export function extractTargetingData(targetAudience?: TargetAudience, audienceAnalysis?: AudienceAnalysis) {
  if (!targetAudience) {
    return {
      age_min: 18,
      age_max: 65,
      genders: [1, 2], // Both
      interests: [],
      demographics: []
    };
  }
  
  // Parse demographics data
  const demographics = targetAudience.demographics || "";
  
  // Try to extract age range using regex
  const ageRangeRegex = /(\d+)[\s-]*to[\s-]*(\d+)/i;
  const ageMatch = demographics.match(ageRangeRegex);
  
  const age_min = ageMatch ? parseInt(ageMatch[1]) : 25;
  const age_max = ageMatch ? parseInt(ageMatch[2]) : 55;
  
  // Try to extract gender
  const genderRegex = /\b(males?|females?|men|women|man|woman)\b/gi;
  const genderMatches = [...demographics.matchAll(genderRegex)];
  
  let genders = [1, 2]; // Default: both genders
  
  if (genderMatches.length > 0) {
    const foundGenders = genderMatches.map(m => m[0].toLowerCase());
    if (foundGenders.some(g => ['male', 'males', 'men', 'man'].includes(g)) && 
        !foundGenders.some(g => ['female', 'females', 'women', 'woman'].includes(g))) {
      genders = [1]; // Male only
    } else if (!foundGenders.some(g => ['male', 'males', 'men', 'man'].includes(g)) && 
               foundGenders.some(g => ['female', 'females', 'women', 'woman'].includes(g))) {
      genders = [2]; // Female only
    }
  }
  
  // Extract interests from pain points and analysis
  const interests = [];
  
  if (targetAudience.painPoints && targetAudience.painPoints.length > 0) {
    // Extract keywords from pain points
    const keywords = targetAudience.painPoints.join(' ')
      .split(' ')
      .filter(word => word.length > 5)
      .filter(word => !['because', 'should', 'would', 'could', 'their', 'about'].includes(word.toLowerCase()))
      .slice(0, 5);
    
    interests.push(...keywords);
  }
  
  if (audienceAnalysis?.marketDesire) {
    // Extract key terms from market desire
    const marketDesireTerms = audienceAnalysis.marketDesire
      .split(' ')
      .filter(word => word.length > 6)
      .slice(0, 3);
    
    interests.push(...marketDesireTerms);
  }
  
  // Remove duplicates and limit to 10 interests
  const uniqueInterests = [...new Set(interests)].slice(0, 10);
  
  return {
    age_min,
    age_max,
    genders,
    interests: uniqueInterests,
    demographics: []
  };
}

/**
 * Calculate a suitable daily budget based on project data
 */
export function suggestDailyBudget(): number {
  // Default modest budget
  return 20;
}

/**
 * Generate smart default dates for the campaign
 */
export function generateDefaultDates() {
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 14); // Two weeks by default
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
}
