import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BusinessIdea, TargetAudience } from "../AdWizard";

const mockAudiences: TargetAudience[] = [
  {
    name: "Health-Conscious Professionals",
    description:
      "Busy professionals aged 25-40 who prioritize their health but struggle with maintaining healthy habits.",
    painPoints: [
      "Limited time for health tracking",
      "Stress from work-life balance",
      "Irregular eating habits",
    ],
    demographics: "Urban professionals, income $60k+, tech-savvy",
  },
  {
    name: "Fitness Enthusiasts",
    description:
      "Active individuals who are passionate about fitness and looking to optimize their performance.",
    painPoints: [
      "Need for precise tracking",
      "Performance optimization",
      "Recovery monitoring",
    ],
    demographics: "Age 20-35, gym-goers, health-conscious",
  },
  {
    name: "Health-Focused Parents",
    description:
      "Parents who want to ensure their family maintains healthy habits and stays hydrated.",
    painPoints: [
      "Family health management",
      "Children's hydration",
      "Busy schedule",
    ],
    demographics: "Parents aged 30-45, family-oriented, suburban",
  },
];

const AudienceStep = ({
  businessIdea,
  onNext,
  onBack,
}: {
  businessIdea: BusinessIdea;
  onNext: (audience: TargetAudience) => void;
  onBack: () => void;
}) => {
  // In a real app, we would generate audiences based on the business idea
  const audiences = mockAudiences;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Select Target Audience</h2>
        <p className="text-gray-600 mb-4">
          Choose the audience that best matches your ideal customers.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {audiences.map((audience) => (
          <Card
            key={audience.name}
            className="cursor-pointer hover:border-facebook transition-colors"
            onClick={() => onNext(audience)}
          >
            <CardHeader>
              <CardTitle className="text-lg">{audience.name}</CardTitle>
              <CardDescription>{audience.demographics}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">{audience.description}</p>
              <div className="space-y-2">
                <p className="text-sm font-medium">Pain Points:</p>
                <ul className="text-sm list-disc list-inside text-gray-600">
                  {audience.painPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
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

export default AudienceStep;