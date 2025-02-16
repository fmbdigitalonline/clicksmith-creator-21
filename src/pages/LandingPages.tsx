
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import LandingPageList from "@/components/landing-page/LandingPageList";
import { useNavigate } from "react-router-dom";

const LandingPages = () => {
  const navigate = useNavigate();

  const { data: landingPages, isLoading } = useQuery({
    queryKey: ["landing-pages"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No authenticated user");

      const { data, error } = await supabase
        .from("landing_pages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!landingPages?.length) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center max-w-md mx-auto space-y-4">
          <h2 className="text-2xl font-bold">No Landing Pages Yet</h2>
          <p className="text-muted-foreground">
            You haven't created any landing pages yet. Choose a project and click the create landing page button to get started.
          </p>
          <Button 
            onClick={() => navigate("/projects")}
            className="mt-4"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            View Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <LandingPageList />
    </div>
  );
};

export default LandingPages;
