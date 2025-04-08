
import { Card } from "@/components/ui/card";
import { useTranslation } from "react-i18next";

export const EmptyState = () => {
  const { t } = useTranslation();
  
  return (
    <Card className="p-6">
      <p className="text-center text-gray-500">
        {t("gallery.empty_state", "No saved ads yet. Like or favorite ads to see them here!")}
      </p>
    </Card>
  );
};
