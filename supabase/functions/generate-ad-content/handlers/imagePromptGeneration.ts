export async function generateImagePrompts(businessIdea: any, targetAudience: any) {
  console.log('Generating image prompts for:', { businessIdea, targetAudience });
  
  return {
    prompts: [
      "Professional team collaborating in modern office setting",
      "Happy customer using product with visible results",
      "Before and after comparison showing benefits"
    ]
  };
}