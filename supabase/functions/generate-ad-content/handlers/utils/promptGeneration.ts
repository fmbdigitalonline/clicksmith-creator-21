import { BusinessIdea, TargetAudience } from '../../types.ts';

export function generatePrompts(
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  hook: string,
  numberOfVariants: number
): string[] {
  const basePrompt = `Create a compelling advertisement for the following business:
Business: ${businessIdea.description}
Target Audience: ${targetAudience.description}
Key Hook: ${hook}

The ad should:
1. Be engaging and memorable
2. Clearly communicate the value proposition
3. Speak directly to the target audience's needs
4. Use the hook creatively
5. Be concise and impactful

Please provide a complete ad copy that includes a headline and body text.`;

  // Generate multiple prompts with slight variations to get diverse results
  return Array(numberOfVariants).fill(basePrompt).map((prompt, index) => 
    `${prompt}\n\nThis is variant ${index + 1}/${numberOfVariants}. Make this version unique while maintaining effectiveness.`
  );
}