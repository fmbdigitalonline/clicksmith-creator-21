
import Navigation from "../Navigation";
import AppSidebar from "../AppSidebar";
import BreadcrumbNav from "../Breadcrumb";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";

export const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  // Update document direction based on language
  useEffect(() => {
    // Languages that require RTL (right-to-left) layout
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    
    // Check if current language is RTL
    const isRtl = rtlLanguages.includes(i18n.language);
    
    // Set the dir attribute on html element
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    
    // Add a class to the body for additional RTL styling if needed
    if (isRtl) {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
    
    // Clean up function
    return () => {
      document.body.classList.remove('rtl');
    };
  }, [i18n.language]);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0 relative">
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
