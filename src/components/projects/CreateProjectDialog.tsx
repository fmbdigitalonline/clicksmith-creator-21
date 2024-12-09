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
import { supabase } from "@/integrations/supabase/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Rocket } from "lucide-react";

const projectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  tags: z.string().optional(),
});

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const CreateProjectDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: CreateProjectDialogProps) => {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getCurrentUser();
  }, []);

  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof projectSchema>) => {
    if (!userId) {
      toast({
        title: "Error creating project",
        description: "You must be logged in to create a project",
        variant: "destructive",
      });
      return;
    }

    const tags = values.tags
      ? values.tags.split(",").map((tag) => tag.trim())
      : [];

    const { data, error } = await supabase.from("projects").insert({
      title: values.title,
      description: values.description || null,
      tags,
      user_id: userId,
      status: "draft",
    }).select();

    if (error) {
      toast({
        title: "Error creating project",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Project created",
      description: "Your project has been created successfully.",
    });

    if (data && data[0]) {
      setCreatedProjectId(data[0].id);
      setShowActions(true);
    }
    
    form.reset();
    onSuccess();
  };

  const handleGenerateAds = () => {
    if (createdProjectId) {
      navigate(`/ad-wizard/${createdProjectId}`);
      onOpenChange(false);
    }
  };

  const handleBackToProjects = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
        </DialogHeader>
        {!showActions ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Project title" {...field} />
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Project description"
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
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter tags separated by commas"
                        {...field}
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
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create Project</Button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <p className="text-center text-muted-foreground">
              What would you like to do next?
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleGenerateAds}
                className="w-full"
                size="lg"
              >
                <Rocket className="mr-2" />
                Generate Ads
              </Button>
              <Button
                onClick={handleBackToProjects}
                variant="outline"
                className="w-full"
                size="lg"
              >
                <ArrowLeft className="mr-2" />
                Back to Projects
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateProjectDialog;