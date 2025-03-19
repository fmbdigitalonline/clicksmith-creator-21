
import { AdHook } from "@/types/adWizard";
import AdPreviewCard from "./components/AdPreviewCard";
import { useTranslation } from "react-i18next";

interface PlatformContentProps {
  platformName: string;
  adVariants: any[];
  onCreateProject: () => void;
  videoAdsEnabled?: boolean;
  selectedFormat?: { width: number; height: number; label: string };
  selectable?: boolean;
  selectedAdIds?: string[];
  onAdSelect?: (id: string, selected: boolean) => void;
}

const PlatformContent = ({ 
  platformName, 
  adVariants = [], 
  onCreateProject,
  videoAdsEnabled = false,
  selectedFormat,
  selectable = false,
  selectedAdIds = [],
  onAdSelect
}: PlatformContentProps) => {
  const { t, i18n } = useTranslation('adwizard');
  
  // Filter variants by platform and ensure we only show 2 variants per unique image
  const filteredVariants = (() => {
    // First, filter by platform
    const platformVariants = Array.isArray(adVariants) 
      ? adVariants.filter(v => v.platform === platformName)
      : [];

    // Group by image URL to ensure we don't show duplicate images
    const uniqueImages = new Map();
    platformVariants.forEach(variant => {
      const imageUrl = variant.imageUrl || variant.image?.url;
      if (!uniqueImages.has(imageUrl)) {
        uniqueImages.set(imageUrl, []);
      }
      if (uniqueImages.get(imageUrl).length < 2) { // Limit to 2 variants per image
        uniqueImages.get(imageUrl).push(variant);
      }
    });

    // Flatten the map back to an array
    return Array.from(uniqueImages.values()).flat();
  })();

  if (filteredVariants.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">{t('no_ad_variants')}</p>
      </div>
    );
  }

  const platformSpecificMessages = {
    facebook: {
      en: "Perfect for Facebook Feed, Stories, and Instagram",
      nl: "Perfect voor Facebook Feed, Stories en Instagram",
      es: "Perfecto para Facebook Feed, Stories e Instagram",
      fr: "Parfait pour Facebook Feed, Stories et Instagram",
      de: "Perfekt für Facebook Feed, Stories und Instagram"
    },
    google: {
      en: "Optimized for Google Display Network and YouTube",
      nl: "Geoptimaliseerd voor Google Display Netwerk en YouTube",
      es: "Optimizado para Google Display Network y YouTube",
      fr: "Optimisé pour Google Display Network et YouTube",
      de: "Optimiert für Google Display Network und YouTube"
    },
    linkedin: {
      en: "Professional format for LinkedIn Feed and Sponsored Content",
      nl: "Professioneel formaat voor LinkedIn Feed en gesponsorde content",
      es: "Formato profesional para LinkedIn Feed y Contenido Patrocinado",
      fr: "Format professionnel pour LinkedIn Feed et Contenu Sponsorisé",
      de: "Professionelles Format für LinkedIn Feed und gesponserte Inhalte"
    },
    tiktok: {
      en: "Engaging format for TikTok For Business",
      nl: "Aantrekkelijk formaat voor TikTok For Business",
      es: "Formato atractivo para TikTok For Business",
      fr: "Format engageant pour TikTok For Business",
      de: "Ansprechendes Format für TikTok For Business"
    }
  };

  const currentLanguage = i18n.language;
  const fallbackLanguage = 'en';
  
  // Get message for current platform in current language or fallback to English
  const platformMessage = platformSpecificMessages[platformName as keyof typeof platformSpecificMessages]?.[
    currentLanguage as keyof (typeof platformSpecificMessages)['facebook']
  ] || platformSpecificMessages[platformName as keyof typeof platformSpecificMessages]?.[fallbackLanguage];

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 mb-4">{platformMessage}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredVariants.map((variant, index) => (
          <AdPreviewCard
            key={`${platformName}-${index}-${variant.imageUrl || variant.image?.url}`}
            variant={variant}
            onCreateProject={onCreateProject}
            isVideo={videoAdsEnabled}
            selectedFormat={selectedFormat}
            selectable={selectable}
            selected={selectedAdIds.includes(variant.id)}
            onSelect={onAdSelect}
          />
        ))}
      </div>
    </div>
  );
};

export default PlatformContent;
