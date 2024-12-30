import { BusinessIdea, TargetAudience, AdHook } from "@/types/adWizard";

interface GoogleAdAsset {
  type: 'image' | 'video' | 'text';
  format: string;
  content: string;
  dimensions?: {
    width: number;
    height: number;
  };
  ratio?: string;
  platform: 'google';
}

export const generateGoogleAds = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  adHooks: AdHook[],
  videoEnabled: boolean = false
) => {
  const assets: GoogleAdAsset[] = [];

  // Generate App Campaign Assets
  const appCampaignAssets = generateAppCampaignAssets(businessIdea, targetAudience, adHooks, videoEnabled);
  assets.push(...appCampaignAssets);

  // Generate Demand Gen Campaign Assets
  const demandGenAssets = generateDemandGenAssets(businessIdea, targetAudience, adHooks, videoEnabled);
  assets.push(...demandGenAssets);

  // Generate Responsive Display Ad Assets
  const responsiveDisplayAssets = generateResponsiveDisplayAssets(businessIdea, targetAudience, adHooks, videoEnabled);
  assets.push(...responsiveDisplayAssets);

  // Generate Performance Max Campaign Assets
  const performanceMaxAssets = generatePerformanceMaxAssets(businessIdea, targetAudience, adHooks, videoEnabled);
  assets.push(...performanceMaxAssets);

  return formatAssetsForDisplay(assets);
};

const generateAppCampaignAssets = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  adHooks: AdHook[],
  videoEnabled: boolean
): GoogleAdAsset[] => {
  const assets: GoogleAdAsset[] = [];

  // Add horizontal image
  assets.push({
    type: 'image',
    format: 'horizontal',
    content: `${businessIdea.description} - Horizontal Format`,
    dimensions: { width: 1200, height: 628 },
    ratio: '1.91:1',
    platform: 'google'
  });

  // Add square image
  assets.push({
    type: 'image',
    format: 'square',
    content: `${businessIdea.description} - Square Format`,
    dimensions: { width: 1200, height: 1200 },
    ratio: '1:1',
    platform: 'google'
  });

  if (videoEnabled) {
    assets.push({
      type: 'video',
      format: 'horizontal',
      content: `${businessIdea.description} - Video Format`,
      ratio: '16:9',
      platform: 'google'
    });
  }

  return assets;
};

const generateDemandGenAssets = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  adHooks: AdHook[],
  videoEnabled: boolean
): GoogleAdAsset[] => {
  const assets: GoogleAdAsset[] = [];
  
  // Add core text assets
  assets.push({
    type: 'text',
    format: 'headline',
    content: truncateText(businessIdea.description, 40),
    platform: 'google'
  });

  // Add image assets
  assets.push({
    type: 'image',
    format: 'logo',
    content: `${businessIdea.description} - Brand Logo`,
    dimensions: { width: 1200, height: 1200 },
    ratio: '1:1',
    platform: 'google'
  });

  return assets;
};

const generateResponsiveDisplayAssets = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  adHooks: AdHook[],
  videoEnabled: boolean
): GoogleAdAsset[] => {
  const assets: GoogleAdAsset[] = [];

  adHooks.forEach((hook, index) => {
    assets.push({
      type: 'text',
      format: 'headline',
      content: truncateText(hook.text, 30),
      platform: 'google'
    });
  });

  return assets;
};

const generatePerformanceMaxAssets = (
  businessIdea: BusinessIdea,
  targetAudience: TargetAudience,
  adHooks: AdHook[],
  videoEnabled: boolean
): GoogleAdAsset[] => {
  const assets: GoogleAdAsset[] = [];

  // Add performance max specific assets
  assets.push({
    type: 'image',
    format: 'horizontal',
    content: `${businessIdea.description} - Performance Campaign`,
    dimensions: { width: 1200, height: 628 },
    ratio: '1.91:1',
    platform: 'google'
  });

  return assets;
};

const formatAssetsForDisplay = (assets: GoogleAdAsset[]) => {
  return assets.map((asset, index) => ({
    platform: 'google',
    headline: asset.type === 'text' ? asset.content : `Google Ad ${index + 1}`,
    description: asset.content,
    image: {
      url: 'placeholder-url', // This would be replaced with actual generated image URL
      prompt: asset.content
    },
    size: asset.dimensions || { width: 1200, height: 628 },
    specs: {
      designRecommendations: {
        fileTypes: ['jpg', 'png'],
        aspectRatios: asset.ratio || '1.91:1'
      },
      textRecommendations: {
        primaryTextLength: '90 characters',
        headlineLength: '30 characters'
      }
    }
  }));
};

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};