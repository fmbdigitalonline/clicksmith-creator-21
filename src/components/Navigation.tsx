import { Link, useLocation } from "react-router-dom";
import { LogIn, Home, FileText, FolderKanban } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

const Navigation = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <div className="w-full border-b">
      <div className="container flex h-16 items-center px-4">
        <Link to="/" className="mr-6 flex items-center space-x-2">
          <FileText className="h-6 w-6" />
          <span className="hidden font-bold sm:inline-block">
            Document Manager
          </span>
        </Link>
        
        <NavigationMenu className="hidden md:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-3 p-6 w-[400px]">
                  <li className="row-span-3">
                    <Link
                      to="/"
                      className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                    >
                      <FolderKanban className="h-6 w-6" />
                      <div className="mb-2 mt-4 text-lg font-medium">
                        Projects
                      </div>
                      <p className="text-sm leading-tight text-muted-foreground">
                        Manage your documents and projects efficiently
                      </p>
                    </Link>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="ml-auto flex items-center space-x-4">
          {!isLoginPage ? (
            <Button asChild variant="ghost">
              <Link to="/login" className="flex items-center space-x-2">
                <LogIn className="h-5 w-5" />
                <span>Login</span>
              </Link>
            </Button>
          ) : (
            <Button asChild variant="ghost">
              <Link to="/" className="flex items-center space-x-2">
                <Home className="h-5 w-5" />
                <span>Home</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navigation;