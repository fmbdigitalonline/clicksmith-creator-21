
import Navigation from "../Navigation";
import { AppSidebar } from "../AppSidebar";
import BreadcrumbNav from "../Breadcrumb";
import { useMediaQuery } from "@/hooks/use-mobile";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  return (
    <div className="flex flex-col w-full min-h-screen">
      <Navigation />
      <div className="flex flex-col md:flex-row h-[calc(100vh-4rem)] mt-16">
        {/* Desktop Sidebar */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        {/* Mobile Sidebar */}
        {isMobile && (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon"
                className="fixed bottom-4 right-4 h-12 w-12 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 z-50"
              >
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] sm:w-[385px] p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <AppSidebar />
            </SheetContent>
          </Sheet>
        )}

        <main className="flex-1 p-3 md:p-6 overflow-auto w-full">
          <div className="glass p-3 md:p-6 min-h-[calc(100vh-8rem)]" role="main" aria-label="Main content">
            <div className="md:block">
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
