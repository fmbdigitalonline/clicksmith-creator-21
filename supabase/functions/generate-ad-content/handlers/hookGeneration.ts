export async function generateHooks(businessIdea: any, targetAudience: any) {
  console.log('Generating hooks for:', { businessIdea, targetAudience });
  
  // Return mock data for now
  return {
    hooks: [
      {
        text: "Transform your business with AI-powered insights",
        description: "Focus on innovation and technological advancement"
      },
      {
        text: "Save 50% of your time with automated solutions",
        description: "Emphasize efficiency and cost savings"
      },
      {
        text: "Join successful businesses using our platform",
        description: "Social proof and success stories"
      }
    ]
  };
}