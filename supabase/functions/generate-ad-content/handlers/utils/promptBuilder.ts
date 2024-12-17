interface BusinessIdea {
  description: string;
  valueProposition: string;
}

interface TargetAudience {
  name: string;
  description: string;
}

interface MarketingCampaign {
  hooks: Array<{ description: string }>;
}

export function buildBasePrompt(
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  campaign: MarketingCampaign
): string {
  return `Create a professional, business-appropriate Facebook advertisement image that represents:
${campaign.hooks.map(hook => hook.description).join('\n')}

Business Context:
${businessIdea.description}
Value Proposition: ${businessIdea.valueProposition}

Target Audience:
${targetAudience.name}
${targetAudience.description}

Style requirements:
- Professional corporate photography style
- Clean, minimal composition
- Bright, well-lit scenes
- Business-appropriate attire and settings
- Professional office or business environment
- Maximum 2 people per image
- High-end commercial look
- Business-focused content
- Safe for work, professional content only
- Conservative and appropriate for all audiences
- No text or typography elements
- Focus on professional business imagery`;
}