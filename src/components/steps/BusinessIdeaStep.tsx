import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BusinessIdea } from "../AdWizard";
import { useToast } from "@/components/ui/use-toast";

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
    // For now, we'll just create a mock value proposition
    const valueProposition = `Enhanced version of: ${description}`;

    onNext({
      description,
      valueProposition,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-4">Describe Your Business</h2>
        <p className="text-gray-600 mb-4">
          Tell us about your business idea, and we'll help you create compelling
          ads.
        </p>
        <Textarea
          placeholder="e.g., I'm launching a mobile app that helps people track their daily water intake and stay hydrated..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[150px]"
        />
      </div>
      <div className="flex justify-end">
        <Button onClick={handleSubmit} className="bg-facebook hover:bg-facebook/90">
          Next Step
        </Button>
      </div>
    </div>
  );
};

export default BusinessIdeaStep;