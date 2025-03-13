
import { BusinessIdea, TargetAudience, MarketingHook } from '../../Types.ts';
import { getBasePhotographySpecs, getStrictRequirements, getEnvironmentSpecs } from './photographySpecs.ts';

// New function to generate compliance guidelines for ad copy
const getComplianceGuidelines = (): string => {
  return `CRITICAL COMPLIANCE REQUIREMENTS:
- Avoid making income claims, revenue promises, or guaranteed returns
- Never use phrases like "get rich quick", "instant success", or "guaranteed results"
- Avoid creating false urgency with words like "limited time", "act now", or "last chance"
- Do not make unrealistic promises about timeframes for results
- Avoid exaggerated claims about effectiveness or performance
- Do not include testimonials or success stories without proper context
- Keep language educational and informative rather than promotional
- Focus on the value proposition without overstating outcomes
- Be specific and factual rather than vague and sensational
- Adhere to advertising standards for the specific platform`;
};

// New function to generate platform-specific guidelines
const getPlatformGuidelines = (platform: string = 'facebook'): string => {
  const guidelines = {
    facebook: `FACEBOOK-SPECIFIC GUIDELINES:
- Avoid using "you" or "your" in personal attributes contexts
- Do not include before/after imagery or implications
- Avoid any health claims or personal attributes
- Keep the tone educational and solution-oriented
- Focus on features rather than transformational benefits`,
    
    google: `GOOGLE ADS GUIDELINES:
- Maintain clear, professional language
- Avoid excessive capitalization and exclamation points
- Make sure all claims are verifiable and specific
- Focus on product/service features rather than user outcomes
- Avoid language that could be seen as clickbait`,
    
    linkedin: `LINKEDIN GUIDELINES:
- Maintain professional tone appropriate for business context
- Focus on professional development, not personal gain
- Emphasize educational aspects and industry insights
- Avoid promotional language that oversells capabilities
- Keep claims modest and substantiated`,
    
    tiktok: `TIKTOK GUIDELINES:
- Avoid direct calls to swipe or engage with the ad
- Do not use misleading thumbnails or descriptions
- Keep language authentic and conversational
- Avoid exaggerated claims about lifestyle changes
- Focus on community and shared experiences`
  };
  
  return guidelines[platform] || guidelines.facebook;
};

export const buildMainPrompt = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  hook: MarketingHook,
  platform: string = 'facebook'
): string => {
  return `Create a strictly photorealistic commercial photograph for a professional advertising campaign. The photograph must be indistinguishable from a professional DSLR camera shot, with absolutely no artistic or illustrated elements. The photograph should represent:

"${hook.text}"

Marketing Concept:
${hook.description}

Scene Context:
- Business Type: ${businessIdea.description}
- Target Audience: ${targetAudience.description}
- Value Proposition: ${businessIdea.valueProposition}

Critical Photography Requirements:
${getBasePhotographySpecs()}

${getEnvironmentSpecs()}

Mandatory Requirements:
${getStrictRequirements()}

${getComplianceGuidelines()}

${getPlatformGuidelines(platform)}

IMPORTANT: This MUST be a photorealistic commercial photograph suitable for professional advertising. No artistic interpretations, cartoons, illustrations, or AI-generated looking content allowed. The image should look like it was taken by a professional photographer with a high-end camera.`;
};

export const buildVariationPrompt = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  hook: MarketingHook,
  platform: string = 'facebook'
): string => {
  return `Create another strictly photorealistic commercial photograph for this marketing concept. The image must look like it was taken with a professional DSLR camera, avoiding any artistic or illustrated styles:

"${hook.text}"

Key Focus:
- Marketing Message: ${hook.description}
- Target Audience: ${targetAudience.description}
- Business Context: ${businessIdea.description}

Mandatory Requirements:
${getStrictRequirements()}

Technical Photography Requirements:
${getBasePhotographySpecs()}

${getComplianceGuidelines()}

${getPlatformGuidelines(platform)}

IMPORTANT: Generate ONLY photorealistic commercial photography. No artistic styles, illustrations, or digital art allowed. The result should be indistinguishable from professional stock photography.`;
};
