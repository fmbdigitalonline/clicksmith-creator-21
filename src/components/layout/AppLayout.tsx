
import Navigation from "../Navigation";
import { AppSidebar } from "../AppSidebar";
import BreadcrumbNav from "../Breadcrumb";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col w-full min-h-screen">
      <Navigation />
      <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] mt-16">
        <AppSidebar />
        <main className="flex-1 p-3 md:p-6 overflow-auto">
          <div className="glass p-3 md:p-6 min-h-[calc(100vh-8rem)]" role="main" aria-label="Main content">
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="hover:bg-accent"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="sr-only">Go back</span>
              </Button>
              <BreadcrumbNav />
            </div>
            <div className="mt-4 md:mt-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
