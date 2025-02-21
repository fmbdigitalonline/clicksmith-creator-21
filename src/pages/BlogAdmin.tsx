
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { BlogAdminLayout } from "@/components/blog/admin/BlogAdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

export default function BlogAdmin() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast({
            title: "Authentication required",
            description: "Please sign in to access this page.",
            variant: "destructive",
          });
          navigate("/login");
          return;
        }

        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', session.user.id)
          .single();

        if (error) throw error;

        if (!profile?.is_admin) {
          toast({
            title: "Access denied",
            description: "You don't have permission to access this page.",
            variant: "destructive",
          });
          navigate("/dashboard");
          return;
        }

        setIsAdmin(true);
      } catch (error: any) {
        console.error('Error checking admin status:', error);
        toast({
          title: "Error",
          description: "Failed to verify admin access. Please try again.",
          variant: "destructive",
        });
        navigate("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [navigate, toast]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Helmet>
        <title>Blog Admin | Dashboard</title>
      </Helmet>
      <BlogAdminLayout />
    </>
  );
}
