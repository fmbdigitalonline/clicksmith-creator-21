
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

interface StepNavigationProps {
  onBack: () => void;
  onStartOver: () => void;
  isDisabled?: boolean;
}

const StepNavigation = ({
  onBack,
  onStartOver,
  isDisabled = false
}: StepNavigationProps) => {
  const { t } = useTranslation('common');
  
  return (
    <div className="flex flex-col md:flex-row justify-between gap-4 mb-4">
      <Button
        variant="outline"
        onClick={onBack}
        disabled={isDisabled}
        className="space-x-2 w-full md:w-auto"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{t("back")}</span>
      </Button>
      <Button
        onClick={onStartOver}
        variant="outline"
        disabled={isDisabled}
        className="space-x-2 w-full md:w-auto"
      >
        {t("navigation.start_over")}
      </Button>
    </div>
  );
};

export default StepNavigation;
