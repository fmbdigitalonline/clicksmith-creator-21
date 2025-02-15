
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useSession } from "@supabase/auth-helpers-react";

const LandingNav = () => {
  const session = useSession();
  
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
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <Link to="/pricing">
                Pricing
              </Link>
            </Button>
            {session ? (
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <Link to="/dashboard">
                    Dashboard
                  </Link>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  asChild
                >
                  <Link to="/projects">
                    My Projects
                  </Link>
                </Button>
              </div>
            ) : (
              <Button
                variant="default"
                size="sm"
                asChild
              >
                <Link to="/login">
                  Sign In
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default LandingNav;
