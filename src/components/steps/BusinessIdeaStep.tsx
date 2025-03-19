
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BusinessIdea } from "@/types/adWizard";
import { useToast } from "@/components/ui/use-toast";
import { Wand2, Lightbulb, ArrowRight, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

interface BusinessIdeaStepProps {
  onNext: (idea: BusinessIdea) => void;
  initialBusinessIdea?: BusinessIdea;
}

const BusinessIdeaStep = ({
  onNext,
  initialBusinessIdea,
}: BusinessIdeaStepProps) => {
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation(['adwizard', 'common']);

  // Set initial description when component mounts or initialBusinessIdea changes
  useEffect(() => {
    console.log('Initial business idea:', initialBusinessIdea);
    if (initialBusinessIdea?.description) {
      setDescription(initialBusinessIdea.description);
    }
  }, [initialBusinessIdea]);

  const handleSubmit = async () => {
    if (isSubmitting) return; // Prevent double submission
    
    if (description.length < 10) {
      toast({
        title: t('idea_step.error_title', 'Description too short'),
        description: t('idea_step.error', 'Please provide more details about your idea.'),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
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
      
      await Promise.resolve(onNext(businessIdea));
    } catch (error) {
      console.error('Error submitting business idea:', error);
      toast({
        title: t('common:errors.general', 'Error'),
        description: t('idea_step.submission_error', 'Failed to process your idea. Please try again.'),
        variant: "destructive",
      });
    } finally {
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
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {t('common:loading', 'Processing...')}
            </>
          ) : (
            <>
              {t('idea_step.analyze', 'Analyze My Idea')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </div>

      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-2">
          {initialBusinessIdea 
            ? t('idea_step.review_title', 'Review or Edit Your Idea') 
            : t('idea_step.title', 'Describe your Idea, Product, Concept or Service')}
        </h2>
        <p className="text-gray-600">
          {initialBusinessIdea 
            ? t('idea_step.review_description', 'You can edit your existing idea or continue with it as is.')
            : t('idea_step.description', 'Share your vision and we\'ll help you validate it through targeted market testing.')}
        </p>
      </div>

      <div className="space-y-4">
        <Textarea
          placeholder={t('idea_step.idea_placeholder', 'e.g., I\'m developing a mobile app that helps small business owners automate their social media marketing. It uses AI to generate content and schedule posts based on industry trends...')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[150px] text-base"
          disabled={isSubmitting}
        />
      </div>

      <Card className="p-4 md:p-6 bg-gradient-to-br from-facebook/5 to-transparent border-facebook/20">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <Lightbulb className="w-6 h-6 text-facebook" />
          </div>
          <div>
            <h3 className="font-medium mb-2">{t('idea_step.tips_title', 'Tips for effective validation:')}</h3>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>{t('idea_step.tip_1', 'Describe your unique value proposition')}</li>
              <li>{t('idea_step.tip_2', 'Highlight the problem you\'re solving')}</li>
              <li>{t('idea_step.tip_3', 'Mention your target market')}</li>
              <li>{t('idea_step.tip_4', 'Include any competitive advantages')}</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BusinessIdeaStep;
