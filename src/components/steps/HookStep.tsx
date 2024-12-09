import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TargetAudience, Hook } from "../AdWizard";
import { MessageCircle, ArrowLeft, ArrowRight } from "lucide-react";

const mockHooks: Hook[] = [
  {
    text: "Transform Your Health Journey in Just 5 Minutes a Day!",
    description:
      "Emphasizes quick and easy implementation while promising significant results.",
  },
  {
    text: "The Smart Way to Stay Hydrated - Your Personal Health Assistant",
    description:
      "Positions the product as an intelligent solution to a common problem.",
  },
  {
    text: "Never Miss Your Health Goals Again - Start Your Journey Today!",
    description: "Creates urgency and addresses the fear of failing health goals.",
  },
];

const HookStep = ({
  audience,
  onNext,
  onBack,
}: {
  audience: TargetAudience;
  onNext: (hook: Hook) => void;
  onBack: () => void;
}) => {
  const hooks = mockHooks;

  return (
    <div className="space-y-8">
      <div className="flex justify-between mb-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Previous Step</span>
        </Button>
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-2">Choose Your Ad Hook</h2>
        <p className="text-gray-600">
          Select a compelling message that will grab your audience's attention.
        </p>
      </div>

      <div className="space-y-4">
        {hooks.map((hook) => (
          <Card
            key={hook.text}
            className="relative group cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-facebook"
            onClick={() => onNext(hook)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-facebook/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl" />
            <CardHeader>
              <div className="flex items-center space-x-3">
                <MessageCircle className="w-5 h-5 text-facebook" />
                <CardTitle className="text-lg">{hook.text}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-base">
                {hook.description}
              </CardDescription>
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

export default HookStep;
