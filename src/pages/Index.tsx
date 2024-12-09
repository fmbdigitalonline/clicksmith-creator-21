import ProjectList from "@/components/projects/ProjectList";
import { Button } from "@/components/ui/button";
import { Wand2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Facebook Ad Generator</h1>
          <p className="text-lg text-muted-foreground">
            Create compelling Facebook ads in minutes with our AI-powered wizard
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate("/ad-wizard/new")}
            className="mt-4 gap-2"
          >
            <Wand2 className="h-5 w-5" />
            Start Ad Generation Wizard
          </Button>
        </div>
        <ProjectList />
      </div>
    </div>
  );
};

export default Index;