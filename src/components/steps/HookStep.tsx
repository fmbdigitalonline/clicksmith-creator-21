import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TargetAudience, Hook } from "../AdWizard";

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
  // In a real app, we would generate hooks based on the selected audience
  const hooks = mockHooks;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Choose Your Ad Hook</h2>
        <p className="text-gray-600 mb-4">
          Select the message that will grab your audience's attention.
        </p>
      </div>

      <div className="grid gap-4">
        {hooks.map((hook) => (
          <Card
            key={hook.text}
            className="cursor-pointer hover:border-facebook transition-colors"
            onClick={() => onNext(hook)}
          >
            <CardHeader>
              <CardTitle className="text-lg">{hook.text}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{hook.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
      </div>
    </div>
  );
};

export default HookStep;