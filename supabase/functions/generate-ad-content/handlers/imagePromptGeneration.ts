
import { BusinessIdea, TargetAudience, AdHook } from "../types.ts";
import { buildPrompt } from "./utils/promptBuilder.ts";
import { getPhotographySpecs } from "./utils/photographySpecs.ts";
import { generateImageWithReplicate } from "./utils/replicateUtils.ts";

export async function generateImagePrompts(
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  adHooks: AdHook[],
  platform: string
) {
  console.log("Generating image prompts for platform:", platform);
  
  const specs = getPhotographySpecs(platform);
  const basePrompt = buildPrompt(businessIdea, targetAudience, adHooks);
  
  try {
    const results = await Promise.all(specs.map(async (spec) => {
      const prompt = `${basePrompt}\n\nTechnical specifications:\n${spec.prompt}`;
      console.log("Generating image with prompt:", prompt);
      
      const imageData = await generateImageWithReplicate(prompt, spec.dimensions);
      
      return {
        url: imageData.url,
        width: spec.dimensions.width,
        height: spec.dimensions.height,
        label: spec.label,
        prompt: prompt // Explicitly include the prompt
      };
    }));

    console.log("Generated images:", results);
    return results;
  } catch (error) {
    console.error("Error generating images:", error);
    throw error;
  }
}
