
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { AdminUpdate } from "@/types/admin";

interface EditUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  update: AdminUpdate;
}

export const EditUpdateDialog = ({ open, onOpenChange, update }: EditUpdateDialogProps) => {
  const [title, setTitle] = useState(update.title);
  const [description, setDescription] = useState(update.description);
  const [type, setType] = useState<"feature" | "update" | "incident" | "announcement">(
    update.type
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    setTitle(update.title);
    setDescription(update.description);
    setType(update.type);
  }, [update]);

  const editMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("admin_updates")
        .update({ title, description, type })
        .eq("id", update.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-updates"] });
      toast({
        title: "Update modified",
        description: "The update has been modified successfully",
      });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Update</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="type">Type</label>
            <Select value={type} onValueChange={(value: any) => setType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="feature">Feature</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="incident">Incident</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label htmlFor="title">Title</label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="description">Description</label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            onClick={() => editMutation.mutate()}
            disabled={!title || !description}
          >
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
