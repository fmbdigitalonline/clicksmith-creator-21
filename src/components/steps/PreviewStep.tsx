import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BusinessIdea, TargetAudience, Hook } from "../AdWizard";
import { useToast } from "@/components/ui/use-toast";

const PreviewStep = ({
  businessIdea,
  audience,
  hook,
  onBack,
}: {
  businessIdea: BusinessIdea;
  audience: TargetAudience;
  hook: Hook;
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Preview Your Ad</h2>
        <p className="text-gray-600 mb-4">
          Here's how your ad will look on Facebook.
        </p>
      </div>

      <Card className="border-2">
        <CardContent className="p-6">
          <div className="aspect-video bg-gray-100 mb-4 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Ad Image Preview</p>
          </div>
          <h3 className="text-xl font-bold mb-2">{hook.text}</h3>
          <p className="text-gray-600 mb-4">{businessIdea.valueProposition}</p>
          <div className="bg-facebook text-white px-4 py-2 rounded-lg text-center">
            Learn More
          </div>
        </CardContent>
      </Card>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-2">Ad Details</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>
            <span className="font-medium">Target Audience:</span>{" "}
            {audience.name}
          </li>
          <li>
            <span className="font-medium">Demographics:</span>{" "}
            {audience.demographics}
          </li>
          <li>
            <span className="font-medium">Hook Type:</span> {hook.description}
          </li>
        </ul>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button
          className="bg-facebook hover:bg-facebook/90"
          onClick={handleExport}
        >
          Export Ad
        </Button>
      </div>
    </div>
  );
};

export default PreviewStep;