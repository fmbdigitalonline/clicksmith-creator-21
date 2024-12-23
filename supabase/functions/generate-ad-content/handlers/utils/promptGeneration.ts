import { BusinessIdea, TargetAudience, MarketingHook } from '../../types';
import { buildMainPrompt, buildVariationPrompt } from './promptBuilder.ts';

export const generatePrompts = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  campaign: { hooks: MarketingHook[] }
): string[] => {
  // Generate main prompts from hooks
  const prompts = campaign.hooks.map(hook => 
    buildMainPrompt(businessIdea, targetAudience, hook)
  );

  // Add variations if needed
  while (prompts.length < 6) {
    const randomHook = campaign.hooks[Math.floor(Math.random() * campaign.hooks.length)];
    const variationPrompt = buildVariationPrompt(businessIdea, targetAudience, randomHook);
    prompts.push(variationPrompt);
  }

  return prompts;
};