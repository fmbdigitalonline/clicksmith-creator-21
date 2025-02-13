
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const saveWizardProgress = async (data: any, projectId: string | undefined) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (!projectId) {
      throw new Error('No project ID available for saving progress');
    }

    // Remove current_step from data if it exists to avoid schema issues
    const { current_step, ...updateData } = data;

    const { error } = await supabase
      .from('projects')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (error) throw error;
      
    console.log('Progress saved to project:', projectId);
  } catch (error) {
    console.error('Error saving progress:', error);
    toast({
      title: "Error saving progress",
      description: error instanceof Error ? error.message : "Failed to save progress",
      variant: "destructive",
    });
    throw error; // Re-throw the error so the component can handle it
  }
};

export const clearWizardProgress = async (projectId: string | undefined, userId: string) => {
  try {
    if (!projectId) {
      throw new Error('No project ID available for clearing progress');
    }

    const { error } = await supabase
      .from('projects')
      .update({
        business_idea: null,
        target_audience: null,
        audience_analysis: null,
        selected_hooks: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId);

    if (error) throw error;

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
