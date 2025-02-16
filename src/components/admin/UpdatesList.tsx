
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateUpdateDialog } from "./CreateUpdateDialog";
import { UpdateItem } from "./UpdateItem";
import type { AdminUpdate } from "@/types/admin";

export const UpdatesList = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: updates, isLoading } = useQuery({
    queryKey: ["admin-updates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_updates")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as AdminUpdate[];
    },
  });

  if (isLoading) {
    return <div>Loading updates...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Platform Updates</CardTitle>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Update
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {updates?.map((update) => (
            <UpdateItem key={update.id} update={update} />
          ))}
        </div>
      </CardContent>
      <CreateUpdateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </Card>
  );
};
