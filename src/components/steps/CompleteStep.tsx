import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BusinessIdea, TargetAudience, AdHook, AdFormat, AdImage } from "@/types/adWizard";
import { ArrowLeft, RotateCcw, Download } from "lucide-react";

const CompleteStep = ({
  businessIdea,
  targetAudience,
  adHook,
  adImages,
  adFormat,
  onStartOver,
  onBack,
}: {
  businessIdea: BusinessIdea;
  targetAudience: TargetAudience;
  adHook: AdHook;
  adImages: AdImage[];
  adFormat: AdFormat;
  onStartOver: () => void;
  onBack: () => void;
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="space-x-2 w-full md:w-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous Step</span>
        </Button>
        <div className="flex gap-2">
          <Button
            onClick={onStartOver}
            variant="outline"
            className="space-x-2 w-full md:w-auto"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Start Over</span>
          </Button>
          <Button className="space-x-2 w-full md:w-auto bg-facebook hover:bg-facebook/90">
            <Download className="w-4 h-4" />
            <span>Export All Variants</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Facebook Ad Variants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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

          <div className="mt-6 space-y-4">
            <div>
              <h3 className="font-medium mb-2">Format Details</h3>
              <p className="text-gray-600">
                {adFormat.format} ({adFormat.dimensions.width} x {adFormat.dimensions.height}px)
              </p>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">Target Audience</h3>
              <p className="text-gray-600">{targetAudience.name}</p>
              <p className="text-gray-600 mt-1">{targetAudience.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteStep;