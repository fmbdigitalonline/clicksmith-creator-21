
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const LandingNav = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="container h-full">
        <div className="flex h-full items-center justify-between">
          <Link to="/" className="flex items-center">
            <img 
              src="/lovable-uploads/f8e07bf5-8804-4da4-b270-0ec6c5b8559c.png" 
              alt="Viable" 
              className="h-8 w-auto"
            />
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
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <Link to="/terms">
                Terms
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
            >
              <Link to="/privacy">
                Privacy
              </Link>
            </Button>
            <Button
              variant="default"
              size="sm"
              asChild
            >
              <Link to="/login">
                Sign In
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default LandingNav;
