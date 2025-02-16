
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileCheck, AlertTriangle } from "lucide-react";

export const AdminStats = () => {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [usersResponse, updatesResponse, incidentsResponse] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("admin_updates").select("id", { count: "exact" }).eq("type", "update"),
        supabase.from("admin_updates").select("id", { count: "exact" }).eq("type", "incident"),
      ]);

      return {
        totalUsers: usersResponse.count || 0,
        totalUpdates: updatesResponse.count || 0,
        totalIncidents: incidentsResponse.count || 0,
      };
    },
  });

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalUsers}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Platform Updates</CardTitle>
          <FileCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalUpdates}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Incidents</CardTitle>
          <AlertTriangle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats?.totalIncidents}</div>
        </CardContent>
      </Card>
    </div>
  );
};
