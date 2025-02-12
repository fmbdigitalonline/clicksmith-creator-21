import { useState } from "react";

type Platform = "facebook" | "google" | "linkedin" | "tiktok";

export const usePlatformSwitch = (initialPlatform: Platform = "facebook") => {
  const [platform, setPlatform] = useState<Platform>(initialPlatform);
  const [showPlatformChangeDialog, setShowPlatformChangeDialog] = useState(false);
  const [pendingPlatform, setPendingPlatform] = useState<Platform | null>(null);

  const handlePlatformChange = (newPlatform: Platform, hasExistingAds: boolean) => {
    if (hasExistingAds && newPlatform !== platform) {
      setPendingPlatform(newPlatform);
      setShowPlatformChangeDialog(true);
      return platform; // Return current platform to maintain tab selection
    } else {
      setPlatform(newPlatform);
      return newPlatform;
    }
  };

  const confirmPlatformChange = () => {
    if (pendingPlatform) {
      setPlatform(pendingPlatform);
      setShowPlatformChangeDialog(false);
      const confirmedPlatform = pendingPlatform;
      setPendingPlatform(null);
      return confirmedPlatform;
    }
    return platform;
  };

  const cancelPlatformChange = () => {
    setPendingPlatform(null);
    setShowPlatformChangeDialog(false);
    return platform; // Return the current platform to maintain tab selection
  };

  return {
    platform,
    showPlatformChangeDialog,
    pendingPlatform,
    handlePlatformChange,
    confirmPlatformChange,
    cancelPlatformChange,
    setShowPlatformChangeDialog
  };
};