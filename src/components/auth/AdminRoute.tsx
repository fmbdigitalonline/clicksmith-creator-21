
import { Navigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { Loader2 } from "lucide-react";

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { data: adminStatus, isLoading } = useAdminStatus();
  const { toast } = useToast();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!adminStatus?.isAdmin) {
    toast({
      title: "Access denied",
      description: "You don't have permission to access this page.",
      variant: "destructive",
    });
    return <Navigate to="/dashboard" replace />;
  }

  return <ProtectedRoute>{children}</ProtectedRoute>;
};
