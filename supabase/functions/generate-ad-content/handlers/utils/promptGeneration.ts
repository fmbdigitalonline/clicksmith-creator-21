
import { BusinessIdea, TargetAudience, MarketingHook } from '../../Types.ts';
import { buildMainPrompt, buildVariationPrompt } from './promptBuilder.ts';

export const generatePrompts = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  hook: MarketingHook,
  platform: string = 'facebook',
  count: number = 1
): string[] => {
  const prompts: string[] = [];
  
  // Always include the main prompt
  prompts.push(buildMainPrompt(businessIdea, targetAudience, hook, platform));
  
  // Generate additional variations if requested
  for (let i = 1; i < count; i++) {
    prompts.push(buildVariationPrompt(businessIdea, targetAudience, hook, platform));
  }
  
  return prompts;
};
