
import { BookmarkX } from "lucide-react";
import { useTranslation } from "react-i18next";

export const EmptyState = () => {
  const { t } = useTranslation("gallery");
  
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <BookmarkX className="h-16 w-16 text-muted-foreground mb-4" />
      <h3 className="text-xl font-semibold mb-2">{t("saved_ads")}</h3>
      <p className="text-muted-foreground text-center max-w-md">
        {t("empty_state")}
      </p>
    </div>
  );
};
