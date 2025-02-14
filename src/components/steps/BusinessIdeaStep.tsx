
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BusinessIdea } from "@/types/adWizard";
import { useToast } from "@/components/ui/use-toast";
import { Wand2, Lightbulb, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAudienceGeneration } from "./audience/useAudienceGeneration";

const BusinessIdeaStep = ({
  onNext,
}: {
  onNext: (idea: BusinessIdea) => void;
}) => {
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { generateAudiences, isGenerating } = useAudienceGeneration();

  const handleSubmit = async () => {
    if (isSubmitting || isGenerating) return; // Prevent multiple submissions
    
    if (description.length < 10) {
      toast({
        title: "Description too short",
        description: "Please provide more details about your business idea.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Format the value proposition to be more ad-friendly
      const valueProposition = description
        .replace(/^Enhanced version of:\s*/i, '')
        .split('.')
        .map(sentence => sentence.trim())
        .filter(sentence => sentence.length > 0)
        .join('. ');

      const businessIdea = {
        description,
        valueProposition,
      };

      // First pass the business idea to parent component
      onNext(businessIdea);

      // Then start generating audiences
      console.log('Generating audiences with business idea:', businessIdea);
      await generateAudiences(businessIdea);
      
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast({
        title: "Error",
        description: "Failed to process your business idea. Please try again.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <div className="flex justify-end mb-4">
        <Button
          onClick={handleSubmit}
          className="bg-facebook hover:bg-facebook/90 text-white w-full md:w-auto"
          size="lg"
          disabled={isSubmitting || isGenerating}
        >
          {isSubmitting || isGenerating ? (
            <>Analyzing...</>
          ) : (
            <>
              Analyze My Idea
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </div>

      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-2">Describe Your Business Concept</h2>
        <p className="text-gray-600">
          Share your business idea and we'll help you validate it through targeted market testing.
        </p>
      </div>

      <Card className="p-4 md:p-6 bg-gradient-to-br from-facebook/5 to-transparent border-facebook/20">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <Lightbulb className="w-6 h-6 text-facebook" />
          </div>
          <div>
            <h3 className="font-medium mb-2">Tips for effective validation:</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Describe your unique value proposition</li>
              <li>Highlight the problem you're solving</li>
              <li>Mention your initial target market hypothesis</li>
              <li>Include any competitive advantages</li>
            </ul>
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        <Textarea
          placeholder="e.g., I'm developing a mobile app that helps small business owners automate their social media marketing. It uses AI to generate content and schedule posts based on industry trends..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[150px] text-base"
          disabled={isSubmitting || isGenerating}
        />
      </div>
    </div>
  );
};

export default BusinessIdeaStep;
