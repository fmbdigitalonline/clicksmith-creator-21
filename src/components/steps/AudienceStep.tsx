
import { Button } from "@/components/ui/button";
import { BusinessIdea, TargetAudience } from "@/types/adWizard";
import { ArrowLeft, Wand2, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import AudienceCard from "./audience/AudienceCard";
import ErrorDisplay from "./audience/ErrorDisplay";
import { useAudienceGeneration } from "./audience/useAudienceGeneration";
import StepNavigation from "./complete/StepNavigation";
import { useTranslation } from "react-i18next";

interface AudienceStepProps {
  businessIdea: BusinessIdea;
  onNext: (audience: TargetAudience) => void;
  onBack: () => void;
}

const AudienceStep = ({
  businessIdea,
  onNext,
  onBack,
}: AudienceStepProps) => {
  const {
    audiences,
    isGenerating,
    error,
    generateAudiences
  } = useAudienceGeneration();
  
  const { t } = useTranslation('adwizard');

  useEffect(() => {
    if (audiences.length === 0) {
      generateAudiences(businessIdea, false);
    }
  }, []);

  return (
    <div className="space-y-6 md:space-y-8">
      <StepNavigation 
        onBack={onBack}
        onStartOver={() => {
          // Start over by regenerating audiences
          generateAudiences(businessIdea, true);
        }}
        isDisabled={isGenerating}
      />

      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-2">{t('audience.choose_title', 'Choose Your Target Audience')}</h2>
        <p className="text-gray-600">
          {t('audience.choose_description', 'Select the audience that best matches your ideal customers.')}
        </p>
      </div>

      {error && <ErrorDisplay message={error} />}

      {isGenerating ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-facebook" />
        </div>
      ) : audiences.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">{t('audience.no_audience', 'No audiences generated yet. Please try again.')}</p>
          <Button
            onClick={() => generateAudiences(businessIdea, true)}
            disabled={isGenerating}
            className="bg-facebook hover:bg-facebook/90 text-white mt-4"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            {t('audience.generate_new', 'Generate Audiences')}
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
          {audiences.map((audience, index) => (
            <AudienceCard
              key={`${audience.name}-${index}`}
              audience={audience}
              onClick={() => onNext(audience)}
            />
          ))}
        </div>
      )}

      {audiences.length > 0 && (
        <div className="mt-6 text-center">
          <Button
            onClick={() => generateAudiences(businessIdea, true)}
            disabled={isGenerating}
            className="bg-facebook hover:bg-facebook/90 text-white"
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Wand2 className="w-4 h-4 mr-2" />
            )}
            {isGenerating ? t('audience.regenerating', 'Regenerating...') : t('audience.generate_new', 'Generate New Audiences')}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AudienceStep;
