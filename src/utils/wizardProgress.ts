import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const saveWizardProgress = async (data: any, projectId: string | undefined) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Ensure current_step is included in the data if it exists
    const progressData = {
      ...data,
      current_step: data.current_step || 1, // Default to 1 if not provided
      updated_at: new Date().toISOString()
    };

    if (projectId && projectId !== 'new') {
      const { error } = await supabase
        .from('projects')
        .update({
          ...progressData,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) throw error;
    } else {
      // Use upsert with on_conflict parameter
      const { error } = await supabase
        .from('wizard_progress')
        .upsert(
          {
            user_id: user.id,
            ...progressData
          },
          {
            onConflict: 'user_id',
            ignoreDuplicates: false
          }
        );

      if (error) throw error;
    }

    console.log('Progress saved successfully:', progressData);
  } catch (error) {
    console.error('Error saving progress:', error);
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
          current_step: 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('wizard_progress')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    }

    return true;
  } catch (error) {
    console.error('Error clearing progress:', error);
    toast({
      title: "Error",
      description: "Failed to clear progress",
      variant: "destructive",
    });
    return false;
  }
};