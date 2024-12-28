import { BusinessIdea, TargetAudience } from '../types.ts';

export const generateHooks = async (businessIdea: BusinessIdea, targetAudience: TargetAudience) => {
  try {
    console.log('Generating hooks for:', { businessIdea, targetAudience });

    // For now, return mock data until we implement the actual OpenAI integration
    const mockHooks = [
      {
        text: "Transform Your Business Today",
        description: "Emphasizes immediate action and positive change"
      },
      {
        text: "Unlock Your Potential",
        description: "Appeals to personal growth and achievement"
      },
      {
        text: "Stay Ahead of the Competition",
        description: "Focuses on competitive advantage"
      }
    ];

    console.log('Generated hooks:', mockHooks);
    return { hooks: mockHooks };
  } catch (error) {
    console.error('Error generating hooks:', error);
    throw error;
  }
};