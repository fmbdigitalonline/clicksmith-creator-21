
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, ExternalLink, ArrowRight, Info } from "lucide-react";
import { useTranslation } from "react-i18next";

interface CampaignSuccessDialogProps {
  open: boolean;
  onClose: () => void;
  campaignId: string;
}

export default function CampaignSuccessDialog({
  open,
  onClose,
  campaignId
}: CampaignSuccessDialogProps) {
  const { t } = useTranslation('integrations');
  
  const handleOpenFacebookAdsManager = () => {
    window.open('https://www.facebook.com/adsmanager', '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            {t('campaigns.success_title')}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t('campaigns.success_description')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
              <div>
                <h3 className="font-medium text-blue-800">{t('campaigns.next_steps')}</h3>
                <ol className="mt-2 ml-5 list-decimal text-blue-700 space-y-2">
                  <li>{t('campaigns.step_review')}</li>
                  <li>{t('campaigns.step_activate')}</li>
                  <li>{t('campaigns.step_monitor')}</li>
                </ol>
              </div>
            </div>
          </div>
          
          <Button 
            variant="facebook" 
            className="w-full" 
            onClick={handleOpenFacebookAdsManager}
          >
            {t('campaigns.open_facebook_manager')}
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
          
          <div className="flex justify-between pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              {t('campaigns.close')}
            </Button>
            
            <Button variant="link" size="sm" onClick={onClose}>
              {t('campaigns.create_another')}
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
