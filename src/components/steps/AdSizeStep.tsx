import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdFormat } from "@/types/adWizard";
import { ArrowLeft, ArrowRight } from "lucide-react";

const AD_FORMATS: AdFormat[] = [
  {
    format: "Facebook Feed",
    dimensions: { width: 1080, height: 1080 }
  },
  {
    format: "Facebook Story",
    dimensions: { width: 1080, height: 1920 }
  },
  {
    format: "Facebook Right Column",
    dimensions: { width: 1200, height: 628 }
  }
];

const AdSizeStep = ({
  onNext,
  onBack,
}: {
  onNext: (format: AdFormat) => void;
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
      </div>

      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-2">Choose Ad Format</h2>
        <p className="text-gray-600">
          Select the format that best fits your campaign goals.
        </p>
      </div>

      <div className="grid gap-6">
        {AD_FORMATS.map((format) => (
          <Card
            key={format.format}
            className="relative group cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-facebook"
            onClick={() => onNext(format)}
          >
            <CardHeader>
              <CardTitle>{format.format}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                {format.dimensions.width} x {format.dimensions.height}px
              </p>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-5 h-5 text-facebook" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdSizeStep;