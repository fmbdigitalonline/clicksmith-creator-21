import { useState } from "react";

type Platform = "facebook" | "google" | "linkedin" | "tiktok";

export const usePlatformSwitch = (initialPlatform: Platform = "facebook") => {
  const [platform, setPlatform] = useState<Platform>(initialPlatform);
  const [showPlatformChangeDialog, setShowPlatformChangeDialog] = useState(false);
  const [pendingPlatform, setPendingPlatform] = useState<Platform | null>(null);

  const handlePlatformChange = (newPlatform: Platform, hasExistingAds: boolean) => {
    if (hasExistingAds) {
      setPendingPlatform(newPlatform);
      setShowPlatformChangeDialog(true);
    } else {
      setPlatform(newPlatform);
      return newPlatform;
    }
    return platform; // Return current platform if dialog is shown
  };

  const confirmPlatformChange = () => {
    if (pendingPlatform) {
      setPlatform(pendingPlatform);
      setShowPlatformChangeDialog(false);
      setPendingPlatform(null);
      return pendingPlatform;
    }
    return platform;
  };

  const cancelPlatformChange = () => {
    setPendingPlatform(null);
    setShowPlatformChangeDialog(false);
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