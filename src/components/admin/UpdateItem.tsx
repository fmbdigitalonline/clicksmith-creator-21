
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { EditUpdateDialog } from "./EditUpdateDialog";
import { useToast } from "@/hooks/use-toast";
import type { AdminUpdate } from "@/types/admin";

interface UpdateItemProps {
  update: AdminUpdate;
}

export const UpdateItem = ({ update }: UpdateItemProps) => {
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const publishMutation = useMutation({
    mutationFn: async (published: boolean) => {
      const { error } = await supabase
        .from("admin_updates")
        .update({ published })
        .eq("id", update.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-updates"] });
      toast({
        title: "Update status changed",
        description: `Update is now ${update.published ? "unpublished" : "published"}`,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("admin_updates")
        .delete()
        .eq("id", update.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-updates"] });
      toast({
        title: "Update deleted",
        description: "The update has been permanently removed",
      });
    },
  });

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">{update.title}</h3>
              <p className="text-sm text-muted-foreground">{update.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={update.published}
                onCheckedChange={(checked) => publishMutation.mutate(checked)}
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => deleteMutation.mutate()}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      <EditUpdateDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        update={update}
      />
    </>
  );
};
