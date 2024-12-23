import { BusinessIdea, TargetAudience, MarketingHook } from '../../Types.ts';
import { buildMainPrompt, buildVariationPrompt } from './promptBuilder.ts';

export const generatePrompts = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  hook: MarketingHook,
  count: number = 1
): string[] => {
  const prompts: string[] = [];
  
  // Always include the main prompt
  prompts.push(buildMainPrompt(businessIdea, targetAudience, hook));
  
  // Generate additional variations if requested
  for (let i = 1; i < count; i++) {
    prompts.push(buildVariationPrompt(businessIdea, targetAudience, hook));
  }
  
  return prompts;
};