import { BusinessIdea, TargetAudience, MarketingHook } from '../../Types.ts';
import { getBasePhotographySpecs, getStrictRequirements, getEnvironmentSpecs } from './photographySpecs.ts';

export const buildMainPrompt = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  hook: MarketingHook
): string => {
  return `Create a strictly photorealistic commercial photograph for a professional advertising campaign. The photograph must be indistinguishable from a professional DSLR camera shot, with absolutely no artistic or illustrated elements. The photograph should represent:

"${hook.text}"

Marketing Concept:
${hook.description}

Scene Context:
- Business Type: ${businessIdea.description}
- Target Audience: ${targetAudience.description}
- Value Proposition: ${businessIdea.valueProposition}

Critical Photography Requirements:
${getBasePhotographySpecs()}

${getEnvironmentSpecs()}

Mandatory Requirements:
${getStrictRequirements()}

IMPORTANT: This MUST be a photorealistic commercial photograph suitable for professional advertising. No artistic interpretations, cartoons, illustrations, or AI-generated looking content allowed. The image should look like it was taken by a professional photographer with a high-end camera.`;
};

export const buildVariationPrompt = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  hook: MarketingHook
): string => {
  return `Create another strictly photorealistic commercial photograph for this marketing concept. The image must look like it was taken with a professional DSLR camera, avoiding any artistic or illustrated styles:

"${hook.text}"

Key Focus:
- Marketing Message: ${hook.description}
- Target Audience: ${targetAudience.description}
- Business Context: ${businessIdea.description}

Mandatory Requirements:
${getStrictRequirements()}

Technical Photography Requirements:
${getBasePhotographySpecs()}

IMPORTANT: Generate ONLY photorealistic commercial photography. No artistic styles, illustrations, or digital art allowed. The result should be indistinguishable from professional stock photography.`;
};