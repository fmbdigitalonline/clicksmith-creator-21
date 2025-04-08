
import { useTranslation } from "react-i18next";

interface ErrorDisplayProps {
  message: string;
}

const ErrorDisplay = ({ message }: ErrorDisplayProps) => {
  const { t } = useTranslation();
  
  return (
    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
      <p className="font-medium">{t("errors.occurred", "Error occurred:")}</p>
      <p>{message}</p>
      <p className="text-sm mt-2">{t("errors.try_again_or_contact", "Please try again or contact support if the issue persists.")}</p>
    </div>
  );
};

export default ErrorDisplay;
