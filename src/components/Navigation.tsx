
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { CreditCard, HelpCircle, MessageSquare, BookOpen } from "lucide-react";
import { CreditDisplay } from "./CreditDisplay";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navigation = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  
  const isActive = (path: string) => {
    if (path === "/ad-wizard") {
      return currentPath.includes('/ad-wizard');
    }
    return currentPath === path;
  };
  
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="container h-full">
        <div className="flex h-full items-center justify-between">
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold tracking-tight text-[#1A1F2C] hover:text-primary/90 transition-colors">
              Viable
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <CreditDisplay />
            <Button
              variant="ghost"
              size="sm"
              asChild
              className={cn(
                "gap-2",
                isActive("/pricing") && "bg-accent"
              )}
            >
              <Link to="/pricing">
                <CreditCard className="h-4 w-4" />
                <span>Pricing</span>
              </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <HelpCircle className="h-4 w-4" />
                  <span>Help</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link to="/faq" className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    FAQ
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/contact" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Contact Support
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
