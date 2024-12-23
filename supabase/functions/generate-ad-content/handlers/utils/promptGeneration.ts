import { BusinessIdea, TargetAudience, MarketingHook } from '../../types';
import { buildMainPrompt, buildVariationPrompt } from './promptBuilder.ts';

export const generatePrompts = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  hook: MarketingHook
): string[] => {
  const mainPrompt = buildMainPrompt(businessIdea, targetAudience, hook);
  const variationPrompt = buildVariationPrompt(businessIdea, targetAudience, hook);
  
  return [mainPrompt, variationPrompt];
};