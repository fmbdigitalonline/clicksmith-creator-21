
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface StepNavigationProps {
  onBack?: () => void;
  onNext?: () => void;
  nextDisabled?: boolean;
  loading?: boolean;
  showBack?: boolean;
}

const StepNavigation = ({
  onBack,
  onNext,
  nextDisabled = false,
  loading = false,
  showBack = true,
}: StepNavigationProps) => {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
      {showBack && onBack && (
        <Button
          variant="outline"
          onClick={onBack}
          className="space-x-2 w-full md:w-auto"
          disabled={loading}
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("navigation.previous_step", "Previous Step")}</span>
        </Button>
      )}
      {onNext && (
        <Button
          onClick={onNext}
          disabled={nextDisabled || loading}
          className="bg-facebook hover:bg-facebook/90 text-white w-full md:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              <span>{t("loading", "Processing...")}</span>
            </>
          ) : (
            <>
              <span>{t("navigation.next_step", "Next Step")}</span>
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default StepNavigation;
