
import { Card, CardContent } from "@/components/ui/card";
import MediaPreview from "./MediaPreview";
import AdDetails from "./AdDetails";
import { AdFeedbackControls } from "./AdFeedbackControls";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslation } from "react-i18next";

interface AdPreviewCardProps {
  variant: any;
  onCreateProject: () => void;
  isVideo?: boolean;
  selectedFormat?: { width: number; height: number; label: string };
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
}

const AdPreviewCard = ({
  variant,
  onCreateProject,
  isVideo = false,
  selectedFormat,
  selectable = false,
  selected = false,
  onSelect
}: AdPreviewCardProps) => {
  const { i18n } = useTranslation();
  
  const handleSelect = () => {
    if (onSelect && variant.id) {
      onSelect(variant.id, !selected);
    }
  };

  // Determine whether to show a checkbox
  const showCheckbox = selectable && variant.id && onSelect;
  
  // Get the format to use (variant size, selected format, or default)
  const format = variant.size || selectedFormat || { width: 1080, height: 1080, label: "Square" };

  // Get image URL from the variant
  const imageUrl = variant.imageUrl || variant.image?.url;
  
  // Get headline and description based on variant and current language
  const currentLanguage = i18n.language;
  const variantLanguage = variant.language || 'en';
  
  // Use variant's language if it matches current language, otherwise use as is
  // This assumes headline and description are in the correct language based on variant.language
  const headline = variant.headline || '';
  const description = variant.description || '';

  return (
    <Card className="overflow-hidden">
      <div className="relative">
        {showCheckbox && (
          <div 
            className="absolute top-2 left-2 z-10 bg-white/80 rounded-md p-1 shadow-md cursor-pointer"
            onClick={handleSelect}
          >
            <Checkbox checked={selected} />
          </div>
        )}
        
        <MediaPreview 
          imageUrl={imageUrl}
          isVideo={isVideo}
          format={format}
        />
      </div>
      
      <CardContent className="p-4">
        <AdDetails
          headline={headline}
          description={description}
          platform={variant.platform}
          format={format}
        />
        
        <div className="mt-4">
          <AdFeedbackControls
            variant={variant}
            onCreateProject={onCreateProject}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default AdPreviewCard;
