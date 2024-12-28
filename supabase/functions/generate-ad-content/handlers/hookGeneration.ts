import { BusinessIdea, TargetAudience } from '../types.ts';

export const generateHooks = async (businessIdea: BusinessIdea, targetAudience: TargetAudience) => {
  try {
    console.log('Generating hooks for:', { businessIdea, targetAudience });

    // Construct the prompt for hook generation
    const prompt = `Create marketing hooks for this business and target audience:

Business:
${businessIdea.description}
Value Proposition: ${businessIdea.valueProposition}

Target Audience:
Name: ${targetAudience.name}
Description: ${targetAudience.description}
Demographics: ${targetAudience.demographics}
Pain Points: ${targetAudience.painPoints.join(', ')}
Core Message: ${targetAudience.coreMessage}

Generate 10 unique marketing hooks that:
1. Address specific pain points
2. Highlight the value proposition
3. Speak directly to the target audience
4. Are engaging and memorable
5. Create emotional connection

Return ONLY a valid JSON array with exactly 10 items in this format:
[
  {
    "text": "The actual hook text that will be shown in the ad",
    "description": "The marketing angle explanation"
  }
]`;

    // Mock response for now - in production this would call OpenAI or similar
    const mockHooks = Array(10).fill(null).map((_, index) => ({
      text: `Hook ${index + 1}: Compelling message about ${businessIdea.description}`,
      description: `Marketing angle ${index + 1} targeting ${targetAudience.name}`
    }));

    console.log('Generated hooks:', mockHooks);
    return { hooks: mockHooks };

  } catch (error) {
    console.error('Error generating hooks:', error);
    throw error;
  }
};

// Also export as a named alias for backward compatibility
export { generateHooks as analyzeHooks };