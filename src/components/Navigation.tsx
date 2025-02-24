
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  HelpCircle, 
  MessageSquare, 
  BookOpen as BlogIcon,
  Menu,
} from "lucide-react";
import { CreditDisplay } from "./CreditDisplay";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

const Navigation = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isOpen, setIsOpen] = useState(false);
  
  const isActive = (path: string) => {
    if (path === "/ad-wizard") {
      return currentPath.includes('/ad-wizard');
    }
    return currentPath === path;
  };
  
  const isPublicPage = ["/", "/about", "/help", "/careers", "/privacy", "/terms", "/faq", "/contact", "/blog"].includes(currentPath);

  const menuItems = [
    { path: "/blog", icon: BlogIcon, label: "Blog" },
    { path: "/pricing", icon: CreditCard, label: "Pricing" },
  ];

  const helpMenuItems = [
    { path: "/help", icon: BlogIcon, label: "Help Center" },
    { path: "/contact", icon: MessageSquare, label: "Contact Support" },
  ];
  
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="container h-full">
        <div className="flex h-full items-center justify-between gap-4">
          <Link to="/" className="flex items-center">
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-[#1A1F2C] hover:text-primary/90 transition-colors">
              Viable
            </span>
          </Link>

          {/* Mobile Menu */}
          <div className="flex md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[350px]">
                <div className="flex flex-col gap-4 mt-6">
                  {!isPublicPage && <CreditDisplay />}
                  {menuItems.map((item) => (
                    <Button
                      key={item.path}
                      variant="ghost"
                      size="lg"
                      asChild
                      className={cn(
                        "w-full justify-start gap-2",
                        isActive(item.path) && "bg-accent"
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <Link to={item.path}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </Link>
                    </Button>
                  ))}
                  {helpMenuItems.map((item) => (
                    <Button
                      key={item.path}
                      variant="ghost"
                      size="lg"
                      asChild
                      className="w-full justify-start gap-2"
                      onClick={() => setIsOpen(false)}
                    >
                      <Link to={item.path}>
                        <item.icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </Link>
                    </Button>
                  ))}
                  {!isPublicPage ? (
                    <Button
                      className="w-full mt-4"
                      asChild
                      onClick={() => setIsOpen(false)}
                    >
                      <Link to="/dashboard">Dashboard</Link>
                    </Button>
                  ) : (
                    <Button
                      className="w-full mt-4"
                      asChild
                      onClick={() => setIsOpen(false)}
                    >
                      <Link to="/login">Login</Link>
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-4">
            {!isPublicPage && <CreditDisplay />}
            {menuItems.map((item) => (
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <HelpCircle className="h-4 w-4" />
                  <span>Help</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {helpMenuItems.map((item) => (
                  <DropdownMenuItem key={item.path} asChild>
                    <Link to={item.path} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {!isPublicPage ? (
              <Button asChild>
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to="/login">Login</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
