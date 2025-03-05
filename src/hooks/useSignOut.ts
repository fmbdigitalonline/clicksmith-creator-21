
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSignOut() {
  const [loading, setLoading] = useState(false);

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return { signOut, loading };
}
