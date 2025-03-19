
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AdGenerationControlsProps {
  onBack: () => void;
  onStartOver: () => void;
  onRegenerate: () => void;
  isGenerating: boolean;
  generationStatus: string;
}

const AdGenerationControls = ({
  onBack,
  onStartOver,
  onRegenerate,
  isGenerating,
  generationStatus
}: AdGenerationControlsProps) => {
  const { t } = useTranslation("adwizard");
  
  return (
    <div className="flex items-center justify-between">
      <div className="flex space-x-2">
        <Button variant="outline" size="sm" onClick={onBack} disabled={isGenerating}>
          {t('ad_gallery.back')}
        </Button>
        <Button variant="ghost" size="sm" onClick={onStartOver} disabled={isGenerating}>
          {t('ad_gallery.start_over')}
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        {isGenerating && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            <span>
              {generationStatus || t('ad_gallery.generating')}
            </span>
          </div>
        )}
        
        <Button
          size="sm"
          onClick={onRegenerate}
          disabled={isGenerating}
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-4 w-4" />
          {t('ad_gallery.regenerate')}
        </Button>
      </div>
    </div>
  );
};

export default AdGenerationControls;
