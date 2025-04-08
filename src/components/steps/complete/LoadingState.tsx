
import { Card } from "@/components/ui/card";
import { Loader2, Wand2 } from "lucide-react";
import { TextCycler } from "@/components/TextCycler";
import { useTranslation } from "react-i18next";

const LoadingState = () => {
  const { t } = useTranslation('adwizard');

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-facebook/5 to-background/80 backdrop-blur-sm">
      <Card className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] max-w-[500px] p-8 shadow-xl border-2 border-facebook/10">
        <div className="flex flex-col items-center justify-center space-y-8">
          <div className="relative">
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-facebook/20 to-blue-400/20 rounded-full" />
            <div className="relative flex items-center justify-center">
              <Loader2 className="w-16 h-16 animate-spin text-facebook" />
              <Wand2 className="w-8 h-8 text-facebook absolute" />
            </div>
          </div>
          
          <div className="text-center space-y-4">
            <h3 className="text-2xl font-semibold text-gray-800 animate-fade-in">
              {t('loading.title', 'Finding Your Perfect Customer Match ✨')}
            </h3>
            <p className="text-gray-600 text-lg">
              <TextCycler
                items={[
                  t('loading.analyzing_audience', 'Analyzing your target audience insights 🎯'),
                  t('loading.crafting_hooks', 'Crafting resonating messages 🎣'),
                  t('loading.designing_elements', 'Designing visual elements that connect 🎨'),
                  t('loading.optimizing_copy', 'Tailoring communication for your audience ✍️'),
                  t('loading.generating_variations', 'Creating persona-specific variations 🔄'),
                  t('loading.fine_tuning', 'Fine-tuning messaging for ideal customers 💭'),
                  t('loading.enhancing_engagement', 'Enhancing customer connection potential 📈'),
                  t('loading.perfecting_magic', 'Perfecting your customer targeting ⚡'),
                  t('loading.almost_ready', 'Almost ready to connect with your audience... 🌟'),
                ]}
                interval={2500}
              />
            </p>
            <p className="text-sm text-gray-500 mt-6 animate-pulse">
              {t('loading.might_take_time', 'Finding your perfect audience match might take a minute or two...')}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LoadingState;
