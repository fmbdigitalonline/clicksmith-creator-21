import { Configuration, OpenAIApi } from "npm:openai-edge@1.2.2";
import { BusinessIdea, TargetAudience, MarketingCampaign } from '../types.ts';
import { generatePrompts } from './utils/promptGeneration.ts';

export async function generateCompleteAds(
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  campaign: MarketingCampaign,
  regenerationCount: number = 0
) {
  const configuration = new Configuration({
    apiKey: Deno.env.get('OPENAI_API_KEY'),
  });
  const openai = new OpenAIApi(configuration);

  const prompts = generatePrompts(businessIdea, targetAudience, campaign.hooks[0], 3);

  const responses = await Promise.all(prompts.map(prompt => 
    openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    })
  ));

  const adVariants = responses.map(response => response.data.choices[0].message.content);

  return {
    variants: adVariants,
    regenerationCount,
  };
}

// Make sure to export as a named export
export { generateCompleteAds as default };