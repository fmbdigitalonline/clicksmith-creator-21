import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BusinessIdea, TargetAudience } from "../AdWizard";
import { Users, ArrowLeft, ChevronRight } from "lucide-react";

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
  const audiences = mockAudiences;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Choose Your Target Audience</h2>
        <p className="text-gray-600">
          Select the audience that best matches your ideal customers.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {audiences.map((audience) => (
          <Card
            key={audience.name}
            className="relative group cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-facebook"
            onClick={() => onNext(audience)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-facebook/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl" />
            <CardHeader>
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-5 h-5 text-facebook" />
                <CardTitle className="text-lg">{audience.name}</CardTitle>
              </div>
              <CardDescription>{audience.demographics}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">{audience.description}</p>
              <div className="space-y-2">
                <p className="text-sm font-medium text-facebook">Pain Points:</p>
                <ul className="text-sm list-disc list-inside text-gray-600 space-y-1">
                  {audience.painPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight className="w-5 h-5 text-facebook" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-between">
        <Button
          variant="ghost"
          onClick={onBack}
          className="space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </Button>
      </div>
    </div>
  );
};

export default AudienceStep;