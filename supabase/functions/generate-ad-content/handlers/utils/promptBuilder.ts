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
  return `Create a hyper-realistic commercial photograph for a professional advertising campaign. The photograph should represent:
${campaign.hooks.map(hook => hook.description).join('\n')}

STRICT REQUIREMENTS:
- Must be an actual photograph, absolutely NO illustrations, drawings, or artificial-looking images
- Ultra-realistic, professional commercial photography quality
- Natural, studio-quality lighting with proper shadows and highlights
- Crystal clear focus and professional camera quality
- Real human subjects (when applicable) in authentic business settings
- Real products and environments (no CGI or artificial elements)
- Composition following rule of thirds and professional photography principles
- Color grading matching high-end advertising campaigns

Business Context: ${businessIdea.description}
Value Proposition: ${businessIdea.valueProposition}
Target Audience: ${targetAudience.description}

Additional Photography Specifications:
- Use professional DSLR camera quality
- Shoot in RAW format equivalent
- Maintain perfect exposure
- Ensure proper white balance
- Include subtle bokeh effects where appropriate
- Maintain sharp focus on key subjects
- Use professional color grading
- Include natural environmental lighting`;
}