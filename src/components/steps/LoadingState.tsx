
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

const StepLoadingState = () => {
  const { t } = useTranslation();
  
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-facebook" />
        <p className="text-gray-600">{t("loading.step_data", "Loading step data...")}</p>
      </div>
    </div>
  );
};

export default StepLoadingState;
