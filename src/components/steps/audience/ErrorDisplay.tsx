
import { useTranslation } from "react-i18next";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ErrorDisplayProps {
  message: string;
}

const ErrorDisplay = ({ message }: ErrorDisplayProps) => {
  const { t } = useTranslation();
  
  return (
    <Alert variant="destructive">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{t("errors.occurred", "Error occurred")}</AlertTitle>
      <AlertDescription>
        <p className="mt-1">{message}</p>
        <p className="text-sm mt-2">{t("errors.try_again_or_contact", "Please try again or contact support if the issue persists.")}</p>
      </AlertDescription>
    </Alert>
  );
};

export default ErrorDisplay;
