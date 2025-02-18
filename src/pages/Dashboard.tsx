
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BookOpen, HelpCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";

const Dashboard = () => {
  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Resources</h2>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/faq" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  FAQ
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/contact" className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4" />
                  Support
                </Link>
              </Button>
            </div>
          </Card>
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link to="/projects" className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  Go to Projects
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
