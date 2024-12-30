import { AdFormat, PlatformSpecs } from "@/types/adWizard";

export const getVideoAdSpecs = (): PlatformSpecs => ({
  facebook: {
    formats: ['feed', 'sponsored', 'message'],
    aspectRatios: ['1:1', '16:9']
  },
  google: {
    formats: ['display', 'responsive'],
    aspectRatios: ['1:1', '16:9', '4:5']
  },
  linkedin: {
    formats: ['sponsored', 'message'],
    aspectRatios: ['1:1', '16:9']
  },
  tiktok: {
    formats: ['feed', 'story'],
    aspectRatios: ['9:16', '1:1']
  }
});

export const getImageAdSpecs = (): PlatformSpecs => ({
  facebook: {
    commonSizes: [
      { width: 1200, height: 628, label: "Facebook Feed" }
    ]
  },
  google: {
    commonSizes: [
      { width: 1200, height: 628, label: "Google Display" },
      { width: 1200, height: 1200, label: "Google Square" }
    ]
  },
  linkedin: {
    commonSizes: [
      { width: 1200, height: 627, label: "LinkedIn Feed" },
      { width: 1200, height: 1200, label: "LinkedIn Square" }
    ]
  },
  tiktok: {
    commonSizes: [
      { width: 1080, height: 1920, label: "TikTok Portrait" },
      { width: 1080, height: 1080, label: "TikTok Square" }
    ]
  }
});

export const platformConfig = {
  facebook: { width: 1200, height: 628, label: "Facebook Feed" },
  google: { width: 1200, height: 628, label: "Google Display" },
  linkedin: { width: 1200, height: 627, label: "LinkedIn Feed" },
  tiktok: { width: 1080, height: 1920, label: "TikTok Portrait" }
};