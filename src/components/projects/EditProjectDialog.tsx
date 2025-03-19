
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const projectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  tags: z.string().optional(),
  status: z.string(),
});

interface Project {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  status: string;
}

interface EditProjectDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EditProjectDialog = ({
  project,
  open,
  onOpenChange,
  onSuccess,
}: EditProjectDialogProps) => {
  const { toast } = useToast();
  const { t } = useTranslation(['projects', 'common']);

  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: project.title,
      description: project.description || "",
      tags: project.tags?.join(", ") || "",
      status: project.status,
    },
  });

  const onSubmit = async (values: z.infer<typeof projectSchema>) => {
    const tags = values.tags
      ? values.tags.split(",").map((tag) => tag.trim())
      : [];

    const { error } = await supabase
      .from("projects")
      .update({
        title: values.title,
        description: values.description || null,
        tags,
        status: values.status,
      })
      .eq("id", project.id);

    if (error) {
      toast({
        title: t('errors.general', 'Error updating project', { ns: 'common' }),
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: t('edit.success'),
      description: t('edit.success_description'),
    });
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('edit.title')}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.title')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('form.title_placeholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.notes')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('form.notes_placeholder')}
                      {...field}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('form.tags')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('form.tags_placeholder')}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('filters.status')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={t('filters.status')} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">{t('filters.draft')}</SelectItem>
                      <SelectItem value="in_progress">{t('filters.in_progress')}</SelectItem>
                      <SelectItem value="completed">{t('filters.completed')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                {t('actions.cancel', 'Cancel', { ns: 'common' })}
              </Button>
              <Button type="submit">{t('actions.save', 'Save Changes', { ns: 'common' })}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProjectDialog;
