
import { Button } from "@/components/ui/button";
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
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useTranslation } from "react-i18next";

const projectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  tags: z.string().optional(),
  businessIdea: z.string().min(10, "Please provide more details about your business idea"),
});

export type ProjectFormData = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  onSubmit: (values: ProjectFormData) => void;
  onCancel: () => void;
  initialBusinessIdea?: string;
  disabled?: boolean;
}

const ProjectForm = ({ onSubmit, onCancel, initialBusinessIdea, disabled }: ProjectFormProps) => {
  const { t } = useTranslation('projects');
  
  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: "",
      businessIdea: initialBusinessIdea || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.title')}</FormLabel>
              <FormControl>
                <Input 
                  placeholder={t('form.title_placeholder')} 
                  {...field} 
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="businessIdea"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('form.business_idea')}</FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t('form.business_idea_placeholder')}
                  {...field}
                  rows={4}
                  disabled={disabled}
                />
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
                  disabled={disabled}
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
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={disabled}
          >
            {t('form.cancel')}
          </Button>
          <Button type="submit" disabled={disabled}>{t('form.create')}</Button>
        </div>
      </form>
    </Form>
  );
};

export default ProjectForm;
