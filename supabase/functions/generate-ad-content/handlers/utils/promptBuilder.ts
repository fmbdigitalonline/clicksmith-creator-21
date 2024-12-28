import { BusinessIdea, TargetAudience, MarketingHook } from '../../Types.ts';
import { getBasePhotographySpecs, getStrictRequirements, getEnvironmentSpecs } from './photographySpecs.ts';

export const buildMainPrompt = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  hook: MarketingHook
): string => {
  return `Create a hyper-realistic commercial photograph for a professional advertising campaign. The photograph should represent:

"${hook.text}"

Marketing Concept:
${hook.description}

Scene Context:
- Business Type: ${businessIdea.description}
- Target Audience: ${targetAudience.description}
- Value Proposition: ${businessIdea.valueProposition}

Photography Requirements:
${getBasePhotographySpecs()}

${getEnvironmentSpecs()}

Critical Requirements:
${getStrictRequirements()}`;
};

export const buildVariationPrompt = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  hook: MarketingHook
): string => {
  return `Create another hyper-realistic commercial photograph for this marketing concept:
"${hook.text}"

Key Focus:
- Marketing Message: ${hook.description}
- Target Audience: ${targetAudience.description}
- Business Context: ${businessIdea.description}

Mandatory Requirements:
${getStrictRequirements()}

Technical Requirements:
${getBasePhotographySpecs()}`;
};