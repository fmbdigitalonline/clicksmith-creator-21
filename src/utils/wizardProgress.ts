
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const saveWizardProgress = async (data: any, projectId: string | undefined) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (projectId && projectId !== 'new') {
      // If we have a project ID, save to projects table
      const { error } = await supabase
        .from('projects')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .eq('user_id', user.id);

      if (error) throw error;
    } else {
      // For new projects, use wizard_progress table
      const { data: existingProgress, error: fetchError } = await supabase
        .from('wizard_progress')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (!existingProgress) {
        // Create new wizard progress if it doesn't exist
        const { error: insertError } = await supabase
          .from('wizard_progress')
          .insert({
            user_id: user.id,
            ...data,
            version: 1
          });

        if (insertError) throw insertError;
      } else {
        // Use the atomic update function for wizard progress
        const { data: result, error } = await supabase
          .rpc('update_wizard_progress_with_lock', {
            p_user_id: user.id,
            p_current_step: data.current_step || existingProgress.current_step || 1,
            p_business_idea: data.business_idea || existingProgress.business_idea || null,
            p_target_audience: data.target_audience || existingProgress.target_audience || null,
            p_audience_analysis: data.audience_analysis || existingProgress.audience_analysis || null,
            p_selected_hooks: data.selected_hooks || existingProgress.selected_hooks || null
          });

        if (error) throw error;

        if (!result) {
          const { toast } = useToast();
          toast({
            title: "Save in progress",
            description: "Another save operation is in progress. Please wait a moment.",
            variant: "default",
          });
          return;
        }
      }
    }

    console.log('Progress saved successfully:', data);
  } catch (error) {
    console.error('Error saving progress:', error);
    const { toast } = useToast();
    toast({
      title: "Error saving progress",
      description: error instanceof Error ? error.message : "Failed to save progress",
      variant: "destructive",
    });
  }
};

export const clearWizardProgress = async (projectId: string | undefined, userId: string) => {
  try {
    if (projectId && projectId !== 'new') {
      const { error } = await supabase
        .from('projects')
        .update({
          business_idea: null,
          target_audience: null,
          audience_analysis: null,
          selected_hooks: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId)
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      // First check if wizard progress exists
      const { data: existingProgress } = await supabase
        .from('wizard_progress')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingProgress) {
        const { error } = await supabase
          .from('wizard_progress')
          .delete()
          .eq('user_id', userId);

        if (error) throw error;
      }
    }

    return true;
  } catch (error) {
    console.error('Error clearing progress:', error);
    const { toast } = useToast();
    toast({
      title: "Error",
      description: "Failed to clear progress",
      variant: "destructive",
    });
    return false;
  }
};

export const initializeWizardProgress = async (userId: string) => {
  try {
    const { data: existingProgress } = await supabase
      .from('wizard_progress')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!existingProgress) {
      const { error } = await supabase
        .from('wizard_progress')
        .insert({
          user_id: userId,
          current_step: 1,
          version: 1
        });

      if (error) throw error;
    }

    return true;
  } catch (error) {
    console.error('Error initializing wizard progress:', error);
    return false;
  }
};
