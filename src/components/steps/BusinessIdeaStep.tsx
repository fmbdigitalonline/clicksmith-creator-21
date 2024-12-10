import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BusinessIdea } from "@/types/adWizard";
import { useToast } from "@/components/ui/use-toast";
import { Wand2, Lightbulb, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";

const BusinessIdeaStep = ({
  onNext,
}: {
  onNext: (idea: BusinessIdea) => void;
}) => {
  const [description, setDescription] = useState("");
  const { toast } = useToast();

  const handleSubmit = () => {
    if (description.length < 10) {
      toast({
        title: "Description too short",
        description: "Please provide more details about your business idea.",
        variant: "destructive",
      });
      return;
    }

    // In a real app, we would process this with an AI model
    const valueProposition = `Enhanced version of: ${description}`;

    onNext({
      description,
      valueProposition,
    });
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex justify-end mb-4">
        <Button
          onClick={handleSubmit}
          className="bg-facebook hover:bg-facebook/90 text-white w-full md:w-auto"
          size="lg"
        >
          Next Step
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>

      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-2">Tell us about your business</h2>
        <p className="text-gray-600">
          Describe your product or service, and we'll help you create compelling ads.
        </p>
      </div>

      <Card className="p-4 md:p-6 bg-gradient-to-br from-facebook/5 to-transparent border-facebook/20">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <Lightbulb className="w-6 h-6 text-facebook" />
          </div>
          <div>
            <h3 className="font-medium mb-2">Tips for a great description:</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Focus on the main benefits of your product/service</li>
              <li>Mention what makes you unique</li>
              <li>Include your target market</li>
              <li>Keep it clear and concise</li>
            </ul>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <Textarea
          placeholder="e.g., I'm launching a mobile app that helps people track their daily water intake and stay hydrated. It features smart reminders, progress tracking, and personalized recommendations..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[150px] text-base"
        />
      </div>
    </div>
  );
};

export default BusinessIdeaStep;
