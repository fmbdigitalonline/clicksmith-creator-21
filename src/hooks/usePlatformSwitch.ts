
import { useState } from "react";

type Platform = "facebook" | "google" | "linkedin" | "tiktok";

export const usePlatformSwitch = (initialPlatform: Platform = "facebook") => {
  const [platform, setPlatform] = useState<Platform>(initialPlatform);

  const handlePlatformChange = (newPlatform: Platform) => {
    setPlatform(newPlatform);
    return newPlatform;
  };

  return {
    platform,
    handlePlatformChange,
  };
};
