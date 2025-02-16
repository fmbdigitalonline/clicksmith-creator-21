
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UpdatesList } from "@/components/admin/UpdatesList";
import { AdminStats } from "@/components/admin/AdminStats";
import { Settings2 } from "lucide-react";

const AdminDashboard = () => {
  const navigate = useNavigate();

  // Check if user is admin
  const { data: profile, isLoading } = useQuery({
    queryKey: ["admin-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return profile;
    },
  });

  // Redirect non-admin users
  useEffect(() => {
    if (!isLoading && !profile?.is_admin) {
      navigate("/dashboard");
    }
  }, [profile, isLoading, navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!profile?.is_admin) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center gap-2 mb-6">
        <Settings2 className="h-8 w-8" />
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
      </div>

      <div className="grid gap-6">
        <AdminStats />
        <UpdatesList />
      </div>
    </div>
  );
};

export default AdminDashboard;
