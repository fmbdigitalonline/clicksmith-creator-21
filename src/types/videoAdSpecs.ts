export interface VideoAdSpec {
  platform: string;
  format: string;
  dimensions: {
    width: number;
    height: number;
  };
  aspectRatio: string;
  maxLength: number; // in seconds
  maxFileSize: number; // in MB
  description: string;
}

export const facebookVideoAdSpecs: VideoAdSpec[] = [
  {
    platform: "facebook",
    format: "feed",
    dimensions: {
      width: 1280,
      height: 720
    },
    aspectRatio: "16:9",
    maxLength: 14400, // 240 minutes
    maxFileSize: 4096, // 4GB
    description: "Facebook Feed Video Ad"
  },
  {
    platform: "facebook",
    format: "stories",
    dimensions: {
      width: 1080,
      height: 1920
    },
    aspectRatio: "9:16",
    maxLength: 15,
    maxFileSize: 4096,
    description: "Facebook Stories Video Ad"
  },
  {
    platform: "facebook",
    format: "carousel",
    dimensions: {
      width: 1080,
      height: 1080
    },
    aspectRatio: "1:1",
    maxLength: 30,
    maxFileSize: 2300, // 2.3GB
    description: "Facebook Carousel Video Ad"
  },
  {
    platform: "facebook",
    format: "cover",
    dimensions: {
      width: 1200,
      height: 628
    },
    aspectRatio: "1.91:1",
    maxLength: 7200, // 120 minutes
    maxFileSize: 4096,
    description: "Facebook Cover Video"
  }
];