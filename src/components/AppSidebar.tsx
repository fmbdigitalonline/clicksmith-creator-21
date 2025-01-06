import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useSidebarContext } from "./ui/sidebar";

export function AppSidebar() {
  const { isOpen, setIsOpen } = useSidebarContext();

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 lg:hidden"
        >
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="pl-1 pr-0">
        <div className="px-7">
          <h2 className="mb-4 font-semibold">Navigation</h2>
        </div>
        <ScrollArea className="my-4 h-[calc(100vh-8rem)] pb-10">
          <div className="px-4">
            <div className="space-y-2">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  cn(
                    "group flex w-full items-center rounded-md border border-transparent px-3 py-2 hover:bg-accent hover:text-accent-foreground",
                    isActive && "bg-accent"
                  )
                }
                end
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/projects"
                className={({ isActive }) =>
                  cn(
                    "group flex w-full items-center rounded-md border border-transparent px-3 py-2 hover:bg-accent hover:text-accent-foreground",
                    isActive && "bg-accent"
                  )
                }
              >
                Projects
              </NavLink>
              <NavLink
                to="/saved-ads"
                className={({ isActive }) =>
                  cn(
                    "group flex w-full items-center rounded-md border border-transparent px-3 py-2 hover:bg-accent hover:text-accent-foreground",
                    isActive && "bg-accent"
                  )
                }
              >
                Saved Ads
              </NavLink>
              <NavLink
                to="/settings"
                className={({ isActive }) =>
                  cn(
                    "group flex w-full items-center rounded-md border border-transparent px-3 py-2 hover:bg-accent hover:text-accent-foreground",
                    isActive && "bg-accent"
                  )
                }
              >
                Settings
              </NavLink>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}