import { BusinessIdea, TargetAudience, MarketingHook } from '../types';
import { getBasePhotographySpecs, getStrictRequirements, getEnvironmentSpecs } from './photographySpecs';

export const buildMainPrompt = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  hook: MarketingHook
): string => {
  return `Generate a highly realistic commercial photograph that visually represents this marketing hook:
"${hook.text}"

Marketing Angle: ${hook.description}

Context:
- Business: ${businessIdea.description}
- Target Audience: ${targetAudience.description}
- Value Proposition: ${businessIdea.valueProposition}

${getEnvironmentSpecs()}

Strict Requirements:
${getStrictRequirements()}

Additional Photography Specifications:
${getBasePhotographySpecs()}`;
};

export const buildVariationPrompt = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  hook: MarketingHook
): string => {
  return `Create a different commercial photograph for this marketing hook:
"${hook.text}"

Focus on:
- Marketing Angle: ${hook.description}
- Target Audience: ${targetAudience.description}
- Business Context: ${businessIdea.description}

Style Requirements:
- Professional DSLR quality
- Natural studio lighting
- Modern business setting
- Authentic and relatable

Must Include:
- Real people and environments
- Professional composition
- Sharp focus and high resolution
- Natural lighting and shadows`;
};