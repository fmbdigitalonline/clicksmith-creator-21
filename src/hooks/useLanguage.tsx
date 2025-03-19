
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSession } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export const SUPPORTED_LANGUAGES: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
];

export function useLanguage() {
  const { i18n } = useTranslation();
  const session = useSession();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Get the current language
  const currentLanguage = SUPPORTED_LANGUAGES.find(
    (lang) => lang.code === i18n.language
  ) || SUPPORTED_LANGUAGES[0];

  // Save language preference to user's profile
  const saveLanguagePreference = async (languageCode: string) => {
    if (!session?.user) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ language_preference: languageCode })
        .eq('id', session.user.id);
        
      if (error) throw error;
      
      toast({
        title: i18n.t('settings.language.updated', 'Language updated'),
        description: i18n.t(
          'settings.language.preference_saved', 
          'Your language preference has been saved.'
        ),
      });
    } catch (error) {
      console.error('Error saving language preference:', error);
      toast({
        title: i18n.t('settings.language.error', 'Update error'),
        description: i18n.t(
          'settings.language.update_failed', 
          'Failed to update language preference.'
        ),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Change the language
  const changeLanguage = async (languageCode: string) => {
    await i18n.changeLanguage(languageCode);
    
    // Only save if user is logged in
    if (session?.user) {
      await saveLanguagePreference(languageCode);
    }
  };

  // Load user's language preference
  useEffect(() => {
    const loadUserLanguagePreference = async () => {
      if (!session?.user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('language_preference')
          .eq('id', session.user.id)
          .single();
          
        if (error) throw error;
        
        if (data?.language_preference) {
          // Only change if different from current
          if (data.language_preference !== i18n.language) {
            await i18n.changeLanguage(data.language_preference);
          }
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      }
    };
    
    loadUserLanguagePreference();
  }, [session, i18n]);

  return {
    currentLanguage,
    languages: SUPPORTED_LANGUAGES,
    changeLanguage,
    isLoading,
  };
}
