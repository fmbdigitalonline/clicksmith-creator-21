import { getBasePhotographySpecs, getStrictRequirements, getEnvironmentSpecs } from './photographySpecs';
import { BusinessIdea, TargetAudience, MarketingHook } from '../types';

export const buildMainPrompt = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  hook: MarketingHook
) => {
  return `Generate a highly realistic commercial photograph:
${getEnvironmentSpecs()}

Strict Requirements:
${getStrictRequirements()}

Business Context: ${businessIdea.description}
Target Audience: ${targetAudience.description}
Marketing Hook: ${hook.description}

Additional Photography Specifications:
${getBasePhotographySpecs()}`;
};

export const buildVariationPrompt = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  hook: MarketingHook
) => {
  return `Create a different commercial photograph focusing on:
- Subject: ${hook.description}
- Style: Professional DSLR quality
- Lighting: Natural studio setup
- Environment: Modern business setting

Must Include:
- Real people and environments
- Professional composition
- Sharp focus and high resolution
- Natural lighting and shadows

Business Context: ${businessIdea.description}
Target Audience: ${targetAudience.description}`;
};