import { supabase } from "@/integrations/supabase/client";
import { WizardState, parseWizardProgress } from "./types";
import { useToast } from "@/components/ui/use-toast";

export const useWizardStorage = () => {
  const { toast } = useToast();

  const loadProgress = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return null;

      const { data, error } = await supabase
        .from('wizard_progress')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        throw error;
      }

      // If no data is found, return null instead of throwing an error
      if (!data || data.length === 0) {
        return null;
      }

      return parseWizardProgress(data[0]);
    } catch (error) {
      console.error('Error loading progress:', error);
      toast({
        title: "Error",
        description: "Failed to load your progress. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const saveProgress = async (state: Partial<WizardState>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('wizard_progress')
        .upsert({
          user_id: session.user.id,
          business_idea: state.businessIdea,
          target_audience: state.targetAudience,
          audience_analysis: state.audienceAnalysis,
          selected_hooks: state.selectedHooks,
          ad_format: state.adFormat,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving progress:', error);
      toast({
        title: "Error",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  const clearProgress = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('wizard_progress')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error clearing progress:', error);
      toast({
        title: "Error",
        description: "Failed to clear your progress. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    loadProgress,
    saveProgress,
    clearProgress,
  };
};