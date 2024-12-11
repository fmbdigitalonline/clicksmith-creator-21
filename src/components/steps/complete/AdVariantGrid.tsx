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
          <CardContent className="p-4 space-y-3">
            <h3 className="font-medium text-lg">Variant {index + 1}</h3>
            <div className="space-y-2">
              <p className="text-gray-800 font-medium">{adHook.description}</p>
              <p className="text-facebook font-semibold">{adHook.text}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default AdVariantGrid;