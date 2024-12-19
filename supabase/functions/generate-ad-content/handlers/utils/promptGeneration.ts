import { BusinessIdea, TargetAudience, MarketingCampaign } from '../types';
import { buildMainPrompt, buildVariationPrompt } from './promptBuilder';
import { sanitizePrompt } from './promptUtils';

export const generatePrompts = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  campaign: MarketingCampaign
): string[] => {
  // Generate main prompts from hooks
  const prompts = campaign.hooks.map(hook => 
    sanitizePrompt(buildMainPrompt(businessIdea, targetAudience, hook))
  );

  // Add variations if needed
  while (prompts.length < 6) {
    const randomHook = campaign.hooks[Math.floor(Math.random() * campaign.hooks.length)];
    const variationPrompt = sanitizePrompt(
      buildVariationPrompt(businessIdea, targetAudience, randomHook)
    );
    prompts.push(variationPrompt);
  }

  return prompts;
};