import { AdFormat } from "@/types/adWizard";

export interface PlatformSpecs {
  facebook: AdFormat;
  google: AdFormat;
  linkedin: AdFormat;
  tiktok: AdFormat;
}

export const getVideoAdSpecs = (): PlatformSpecs => ({
  facebook: {
    platform: 'facebook',
    formats: ['feed', 'sponsored', 'message'],
    aspectRatio: '16:9',
    description: 'Facebook video ad specifications'
  },
  google: {
    platform: 'google',
    formats: ['display', 'responsive'],
    aspectRatio: '16:9',
    description: 'Google video ad specifications'
  },
  linkedin: {
    platform: 'linkedin',
    formats: ['sponsored', 'message'],
    aspectRatio: '16:9',
    description: 'LinkedIn video ad specifications'
  },
  tiktok: {
    platform: 'tiktok',
    formats: ['feed', 'story'],
    aspectRatio: '9:16',
    description: 'TikTok video ad specifications'
  }
});

export const getImageAdSpecs = (): PlatformSpecs => ({
  facebook: {
    platform: 'facebook',
    commonSizes: [
      { width: 1200, height: 628, label: "Facebook Feed" }
    ],
    description: 'Facebook image ad specifications'
  },
  google: {
    platform: 'google',
    commonSizes: [
      { width: 1200, height: 628, label: "Google Display" },
      { width: 1200, height: 1200, label: "Google Square" }
    ],
    description: 'Google image ad specifications'
  },
  linkedin: {
    platform: 'linkedin',
    commonSizes: [
      { width: 1200, height: 627, label: "LinkedIn Feed" },
      { width: 1200, height: 1200, label: "LinkedIn Square" }
    ],
    description: 'LinkedIn image ad specifications'
  },
  tiktok: {
    platform: 'tiktok',
    commonSizes: [
      { width: 1080, height: 1920, label: "TikTok Portrait" },
      { width: 1080, height: 1080, label: "TikTok Square" }
    ],
    description: 'TikTok image ad specifications'
  }
});

export const platformConfig = {
  facebook: { width: 1200, height: 628, label: "Facebook Feed" },
  google: { width: 1200, height: 628, label: "Google Display" },
  linkedin: { width: 1200, height: 627, label: "LinkedIn Feed" },
  tiktok: { width: 1080, height: 1920, label: "TikTok Portrait" }
};