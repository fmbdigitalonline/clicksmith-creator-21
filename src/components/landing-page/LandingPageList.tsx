
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Globe, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface LandingPage {
  id: string;
  title: string;
  published: boolean;
  views: number;
  created_at: string;
  project_id: string;
  seo_title?: string;
  seo_description?: string;
  domain?: string;
}

export default function LandingPageList() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: landingPages, isLoading } = useQuery({
    queryKey: ["landing-pages"],
    queryFn: async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error("No authenticated session");
      }

      const { data, error } = await supabase
        .from("landing_pages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "Error loading landing pages",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      return data as LandingPage[];
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Your Landing Pages</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {landingPages?.map((page) => (
          <Card key={page.id}>
            <CardHeader>
              <CardTitle>{page.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Created: {new Date(page.created_at).toLocaleDateString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Views: {page.views}
                </p>
                <p className="text-sm">
                  Status: {page.published ? (
                    <span className="text-green-600 font-medium">Published</span>
                  ) : (
                    <span className="text-yellow-600 font-medium">Draft</span>
                  )}
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/projects/${page.project_id}/landing-page`)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              {page.published && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`/preview/${page.id}`, '_blank')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              )}
              {page.domain && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`https://${page.domain}`, '_blank')}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Visit
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
