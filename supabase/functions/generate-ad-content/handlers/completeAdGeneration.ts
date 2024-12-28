export async function generateCompleteAd(businessIdea: any, targetAudience: any) {
  console.log('Generating complete ad for:', { businessIdea, targetAudience });
  
  return {
    ad: {
      headline: "Transform Your Business Today",
      description: "AI-powered solutions for modern businesses",
      callToAction: "Get Started Now",
      imagePrompt: "Modern office setting with happy professionals using technology"
    }
  };
}