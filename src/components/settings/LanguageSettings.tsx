
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";

export const LanguageSettings = () => {
  const { t } = useTranslation();
  const { currentLanguage, languages, changeLanguage, isLoading } = useLanguage();
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          <CardTitle>{t('settings.sections.language')}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {t('settings.language.choose')}
        </p>
        
        <RadioGroup
          value={currentLanguage.code}
          onValueChange={(value) => changeLanguage(value)}
          className="space-y-3"
        >
          {languages.map((language) => (
            <div key={language.code} className="flex items-center space-x-2">
              <RadioGroupItem value={language.code} id={`language-${language.code}`} />
              <Label htmlFor={`language-${language.code}`} className="flex items-center">
                <span className="mr-2 text-xl">{language.flag}</span>
                {language.name}
                {language.code === currentLanguage.code && (
                  <span className="ml-2 text-xs text-muted-foreground">(Current)</span>
                )}
              </Label>
            </div>
          ))}
        </RadioGroup>
        
        <Button 
          onClick={() => changeLanguage(currentLanguage.code)} 
          disabled={isLoading}
          className="mt-4"
        >
          {t('settings.profile.save')}
        </Button>
      </CardContent>
    </Card>
  );
};
