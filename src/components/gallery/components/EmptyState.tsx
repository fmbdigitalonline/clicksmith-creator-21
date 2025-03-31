
import { Button } from "@/components/ui/button";
import { Image, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const EmptyState = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('gallery');

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
      <div className="bg-white p-4 rounded-full mb-6 shadow-sm">
        <Image className="w-12 h-12 text-gray-400" />
      </div>
      <h3 className="text-xl font-medium text-gray-900 mb-2">{t('empty.title')}</h3>
      <p className="text-gray-500 text-center max-w-md mb-6">
        {t('empty.subtitle')}
      </p>
      <Button 
        onClick={() => navigate('/ad-wizard/new')} 
        className="flex items-center"
      >
        <Plus className="w-4 h-4 mr-2" /> 
        {t('empty.action')}
      </Button>
    </div>
  );
};
