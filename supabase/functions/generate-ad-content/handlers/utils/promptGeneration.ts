import { BusinessIdea, TargetAudience, MarketingHook } from '../../types.ts';

export function generatePrompts(
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  hook: MarketingHook,
  count: number = 3
): string[] {
  const basePrompt = `Create a compelling ad for the following business:
Business: ${businessIdea.description}
Value Proposition: ${businessIdea.valueProposition}
Target Audience: ${targetAudience.description}
Marketing Angle: ${hook.description}
Hook: ${hook.text}`;

  // Generate multiple variations of the prompt
  return Array(count).fill(basePrompt).map((prompt, index) => 
    `${prompt}\n\nGenerate Ad Variation #${index + 1}:\nCreate a unique and engaging ad that incorporates the hook and marketing angle while speaking directly to the target audience's pain points. The ad should be concise, persuasive, and optimized for social media.`
  );
}