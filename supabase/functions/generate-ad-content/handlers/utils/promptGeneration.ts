import { BusinessIdea, TargetAudience, MarketingHook } from '../../types.ts';

export const generatePrompts = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  hook: MarketingHook,
  count: number = 1
): string[] => {
  const prompts: string[] = [];
  
  // Generate the main prompt
  const mainPrompt = buildMainPrompt(businessIdea, targetAudience, hook);
  prompts.push(mainPrompt);
  
  // Generate additional variations if requested
  for (let i = 1; i < count; i++) {
    prompts.push(buildVariationPrompt(businessIdea, targetAudience, hook));
  }
  
  return prompts;
};

const buildMainPrompt = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  hook: MarketingHook
): string => {
  return `Create a compelling ad for the following business and target audience:

Business Description: ${businessIdea.description}
Value Proposition: ${businessIdea.valueProposition}

Target Audience:
- Description: ${targetAudience.description}
- Demographics: ${targetAudience.demographics}
- Pain Points: ${targetAudience.painPoints.join(', ')}

Marketing Hook: ${hook.text}
Hook Context: ${hook.description}

Generate an engaging ad that:
1. Addresses the audience's pain points
2. Highlights the value proposition
3. Uses the marketing hook effectively
4. Maintains a professional and persuasive tone
5. Follows platform-specific best practices`;
};

const buildVariationPrompt = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  hook: MarketingHook
): string => {
  return `Create a different variation of an ad with these parameters:

Core Message: ${hook.text}
Business Type: ${businessIdea.description}
Target Audience: ${targetAudience.description}
Key Pain Points: ${targetAudience.painPoints.join(', ')}

Focus on:
1. Different angle or perspective
2. Alternative emotional appeal
3. Unique way to present the value proposition
4. Fresh approach to the marketing hook
5. Maintaining brand consistency`;
};