import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BusinessIdea, TargetAudience, AdHook } from "@/types/adWizard";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, Download, Facebook } from "lucide-react";

const PreviewStep = ({
  businessIdea,
  audience,
  hook,
  onBack,
}: {
  businessIdea: BusinessIdea;
  audience: TargetAudience;
  hook: AdHook;
  onBack: () => void;
}) => {
  const { toast } = useToast();

  const handleExport = () => {
    toast({
      title: "Ad Exported!",
      description: "Your ad has been saved and is ready for Facebook Ads Manager.",
    });
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="space-x-2 w-full md:w-auto"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous Step</span>
        </Button>
        <Button
          className="bg-facebook hover:bg-facebook/90 space-x-2 w-full md:w-auto"
          onClick={handleExport}
        >
          <Download className="w-4 h-4" />
          <span>Export Ad</span>
        </Button>
      </div>

      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-2">Preview Your Ad</h2>
        <p className="text-gray-600">
          Review how your ad will look on Facebook and make any final adjustments.
        </p>
      </div>

      <Card className="border-2 overflow-hidden">
        <div className="bg-gray-100 p-3 border-b flex items-center space-x-2">
          <Facebook className="w-5 h-5 text-facebook" />
          <span className="font-medium text-gray-700">Facebook News Feed Ad</span>
        </div>
        <CardContent className="p-6">
          <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-50 mb-4 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Ad Image Preview</p>
          </div>
          <h3 className="text-xl font-bold mb-2 text-gray-900">{hook.text}</h3>
          <p className="text-gray-600 mb-4">{businessIdea.valueProposition}</p>
          <Button className="w-full bg-facebook hover:bg-facebook/90">
            Learn More
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-gray-50 border-none">
        <CardContent className="p-6">
          <h4 className="font-medium mb-4 text-gray-900">Ad Details</h4>
          <div className="space-y-4">
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-1">Target Audience</h5>
              <p className="text-sm text-gray-600">{audience.name}</p>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-1">Demographics</h5>
              <p className="text-sm text-gray-600">{audience.demographics}</p>
            </div>
            <div>
              <h5 className="text-sm font-medium text-gray-700 mb-1">Hook Type</h5>
              <p className="text-sm text-gray-600">{hook.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PreviewStep;
