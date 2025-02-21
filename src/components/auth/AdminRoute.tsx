
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: isAdminResult, error } = await supabase.rpc('is_admin');
        
        if (error) {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
          toast({
            title: "Access Denied",
            description: "You don't have permission to access this area",
            variant: "destructive",
          });
          navigate('/dashboard');
          return;
        }

        setIsAdmin(isAdminResult);
        
        if (!isAdminResult) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to access this area",
            variant: "destructive",
          });
          navigate('/dashboard');
        }
      } catch (error) {
        console.error("Error in admin check:", error);
        setIsAdmin(false);
        navigate('/dashboard');
      }
    };

    checkAdminStatus();
  }, [navigate, toast]);

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
