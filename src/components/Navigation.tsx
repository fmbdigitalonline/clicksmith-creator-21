import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Navigation = () => {
  return (
    <nav className="flex items-center space-x-4">
      <Link to="/traffic">
        <Button variant="ghost">Try it now</Button>
      </Link>
      <Link to="/login">
        <Button variant="outline">Sign in</Button>
      </Link>
      <Link to="/pricing">
        <Button className="bg-facebook hover:bg-facebook/90">Get Started</Button>
      </Link>
    </nav>
  );
};

export default Navigation;