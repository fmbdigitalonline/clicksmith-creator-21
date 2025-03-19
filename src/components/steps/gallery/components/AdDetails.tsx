
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

interface AdDetailsProps {
  headline: string;
  description: string;
  platform: string;
  format: {
    width: number;
    height: number;
    label: string;
  };
}

const AdDetails = ({
  headline,
  description,
  platform,
  format
}: AdDetailsProps) => {
  const { t } = useTranslation("adwizard");
  
  // Get platform display name
  const platformNames = {
    facebook: "Facebook",
    google: "Google",
    linkedin: "LinkedIn",
    tiktok: "TikTok"
  };
  
  const platformName = platformNames[platform as keyof typeof platformNames] || platform;
  
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Badge variant="outline" className="text-xs capitalize">
          {platformName}
        </Badge>
        <Badge variant="secondary" className="text-xs bg-slate-100">
          {format.width} × {format.height}
        </Badge>
      </div>
      
      <h3 className="font-semibold text-base line-clamp-2 mb-1">{headline}</h3>
      <p className="text-sm text-gray-600 line-clamp-3">{description}</p>
    </div>
  );
};

export default AdDetails;
