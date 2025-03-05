
import Navigation from "../Navigation";
import AppSidebar from "../AppSidebar";
import BreadcrumbNav from "../Breadcrumb";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navigation />
        <main className="flex-1 overflow-auto p-3 md:p-6 mt-16">
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
          {children}
        </main>
      </div>
    </div>
  );
};
