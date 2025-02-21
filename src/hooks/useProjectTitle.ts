
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

// Simple cache to prevent repeated fetches
const titleCache = new Map<string, string>();

export function useProjectTitle(projectId: string | null) {
  const [title, setTitle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchProjectTitle = async () => {
      if (!projectId) return;
      
      // Check cache first
      if (titleCache.has(projectId)) {
        setTitle(titleCache.get(projectId) || null);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('title')
          .eq('id', projectId)
          .single();

        if (error) throw error;
        if (data?.title) {
          titleCache.set(projectId, data.title);
          setTitle(data.title);
        }
      } catch (error) {
        console.error('Error fetching project title:', error);
        setTitle(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProjectTitle();
  }, [projectId]);

  return { title, isLoading };
}
