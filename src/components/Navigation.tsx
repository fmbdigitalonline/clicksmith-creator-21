
import { Link, useLocation, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Settings, CreditCard, PlusCircle, Images, Menu } from "lucide-react";
import { CreditDisplay } from "./CreditDisplay";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useState } from "react";

const Navigation = () => {
  const location = useLocation();
  const { projectId } = useParams();
  const currentPath = location.pathname;
  const [isOpen, setIsOpen] = useState(false);
  
  const isActive = (path: string) => {
    if (path === "/ad-wizard") {
      return currentPath.includes('/ad-wizard');
    }
    return currentPath === path;
  };

  const handleStartClick = () => {
    window.location.href = "/ad-wizard/new";
  };

  const showAdGallery = currentPath.includes('/ad-wizard');
  const adGalleryUrl = projectId && projectId !== 'new' ? `/ad-wizard/${projectId}` : '/ad-wizard/new';

  const menuItems = [
    {
      label: "Ad Gallery",
      icon: Images,
      path: adGalleryUrl,
      show: showAdGallery,
    },
    {
      label: "Pricing",
      icon: CreditCard,
      path: "/pricing",
      show: true,
    },
    {
      label: "Settings",
      icon: Settings,
      path: "/settings",
      show: true,
    },
  ];
  
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="container h-full">
        <div className="flex h-full items-center justify-between">
          <Link to="/dashboard" className="flex items-center">
            <span className="text-2xl font-bold tracking-tight text-[#1A1F2C] hover:text-primary/90 transition-colors">
              Viable
            </span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <CreditDisplay />
            <Button
              variant="default"
              size="sm"
              onClick={handleStartClick}
              className="gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Start</span>
            </Button>
            {menuItems.map((item) => item.show && (
              <Button
                key={item.path}
                variant="ghost"
                size="sm"
                asChild
                className={cn(
                  "gap-2",
                  isActive(item.path) && "bg-accent"
                )}
              >
                <Link to={item.path}>
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              </Button>
            ))}
          </div>

          {/* Mobile Navigation */}
          <div className="flex md:hidden items-center gap-2">
            <CreditDisplay />
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85vw] sm:w-[385px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="mt-4 flex flex-col gap-2">
                  <Button
                    variant="default"
                    onClick={() => {
                      handleStartClick();
                      setIsOpen(false);
                    }}
                    className="w-full justify-start gap-2"
                  >
                    <PlusCircle className="h-4 w-4" />
                    <span>Start New Campaign</span>
                  </Button>
                  {menuItems.map((item) => item.show && (
                    <Button
                      key={item.path}
                      variant="ghost"
                      asChild
                      className={cn(
                        "w-full justify-start gap-2",
                        isActive(item.path) && "bg-accent"
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <Link to={item.path}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    </Button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
