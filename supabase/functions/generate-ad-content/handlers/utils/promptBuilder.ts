import { BusinessIdea, TargetAudience, MarketingHook } from '../types';
import { getBasePhotographySpecs, getStrictRequirements, getEnvironmentSpecs } from './photographySpecs';

export const buildMainPrompt = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  hook: MarketingHook
): string => {
  return `Create a photorealistic commercial photograph that looks indistinguishable from a professional DSLR camera shot. The image should visually represent this marketing message:

"${hook.text}"

Marketing Concept:
${hook.description}

Scene Context:
- Business Type: ${businessIdea.description}
- Target Audience: ${targetAudience.description}
- Value Proposition: ${businessIdea.valueProposition}

Photography Requirements:
- Ultra-realistic, professional DSLR quality
- Natural, studio-quality lighting with soft shadows
- Crisp, sharp focus with high resolution
- Real-world textures and materials
- No AI artifacts or digital art aesthetics
- Must look like it was shot by a professional photographer

${getEnvironmentSpecs()}

Critical Requirements:
${getStrictRequirements()}

Technical Specifications:
${getBasePhotographySpecs()}`;
};

export const buildVariationPrompt = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  hook: MarketingHook
): string => {
  return `Create another photorealistic commercial photograph for this marketing concept:
"${hook.text}"

Key Focus:
- Marketing Message: ${hook.description}
- Target Audience: ${targetAudience.description}
- Business Context: ${businessIdea.description}

Mandatory Requirements:
- Must be indistinguishable from a real photograph
- Professional DSLR camera quality
- Studio-grade lighting setup
- Modern, authentic business environment
- Real human subjects with natural expressions
- Realistic textures and materials
- No digital art or AI-generated aesthetics

Technical Requirements:
- Ultra-sharp focus throughout
- Professional color grading
- Natural light and shadow interplay
- High-resolution output
- Proper depth of field`;
};