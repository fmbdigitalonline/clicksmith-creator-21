
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ActivitySquare } from "lucide-react";

export default function DiagnosticLink() {
  return (
    <Link to="/diagnostic">
      <Button variant="ghost" size="sm" className="flex items-center gap-1">
        <ActivitySquare className="h-4 w-4" />
        <span>Diagnostics</span>
      </Button>
    </Link>
  );
}
