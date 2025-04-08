
import { CardContent } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

interface AdContentProps {
  primaryText?: string;
  headline?: string;
  imageUrl?: string;
}

export const AdContent = ({ primaryText, headline, imageUrl }: AdContentProps) => {
  const { t } = useTranslation("gallery");
  
  return (
    <>
      {primaryText && (
        <CardContent className="p-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">{t("primary_text")}:</p>
            <p className="text-gray-800">{primaryText}</p>
          </div>
        </CardContent>
      )}
      
      {imageUrl && (
        <div className="aspect-video relative">
          <img
            src={imageUrl}
            alt={t("ad_creative_alt")}
            className="object-cover w-full h-full"
          />
        </div>
      )}

      {headline && (
        <CardContent className="p-4">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-600">{t("headline")}:</p>
            <h3 className="text-lg font-semibold text-facebook">{headline}</h3>
          </div>
        </CardContent>
      )}
    </>
  );
};
