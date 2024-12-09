import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BusinessIdea, TargetAudience, AdHook } from "../AdWizard";
import { ArrowLeft, RotateCcw } from "lucide-react";

const CompleteStep = ({
  businessIdea,
  targetAudience,
  adHook,
  onStartOver,
  onBack,
}: {
  businessIdea: BusinessIdea;
  targetAudience: TargetAudience;
  adHook: AdHook;
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
        <Button
          onClick={onStartOver}
          variant="outline"
          className="space-x-2 w-full md:w-auto"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Start Over</span>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Facebook Ad is Ready!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Hook</h3>
            <p className="text-gray-600">{adHook.text}</p>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Target Audience</h3>
            <p className="text-gray-600">{targetAudience.name}</p>
            <p className="text-gray-600 mt-1">{targetAudience.description}</p>
          </div>

          <div>
            <h3 className="font-medium mb-2">Business Description</h3>
            <p className="text-gray-600">{businessIdea.description}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CompleteStep;