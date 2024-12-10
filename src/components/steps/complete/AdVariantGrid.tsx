import { Card, CardContent } from "@/components/ui/card";
import { AdHook, AdImage, BusinessIdea } from "@/types/adWizard";

interface AdVariantGridProps {
  adImages: AdImage[];
  adHook: AdHook;
  businessIdea: BusinessIdea;
}

const AdVariantGrid = ({ adImages, adHook, businessIdea }: AdVariantGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {adImages.map((image, index) => (
        <Card key={index} className="overflow-hidden">
          <div className="aspect-video relative">
            <img
              src={image.url}
              alt={`Ad variant ${index + 1}`}
              className="object-cover w-full h-full"
            />
          </div>
          <CardContent className="p-4">
            <h3 className="font-medium text-lg mb-2">Variant {index + 1}</h3>
            <p className="text-gray-600 text-sm mb-4">{adHook.text}</p>
            <p className="text-gray-500 text-xs">{businessIdea.valueProposition}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdVariantGrid;