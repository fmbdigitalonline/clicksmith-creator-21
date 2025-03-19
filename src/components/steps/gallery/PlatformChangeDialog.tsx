
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next";

interface PlatformChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const PlatformChangeDialog = ({
  open,
  onOpenChange,
  onConfirm,
  onCancel,
}: PlatformChangeDialogProps) => {
  const { t } = useTranslation("adwizard");
  
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('platform_change.title')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('platform_change.description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>{t('platform_change.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{t('platform_change.confirm')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PlatformChangeDialog;
