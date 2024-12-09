import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider } from "@/components/ui/sidebar";
import Navigation from "./components/Navigation";
import { AppSidebar } from "./components/AppSidebar";
import BreadcrumbNav from "./components/Breadcrumb";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AdWizard from "./components/AdWizard";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gradient-radial from-background via-background to-secondary/20">
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="flex flex-col flex-1">
              <Navigation />
              <div className="flex flex-1">
                <AppSidebar />
                <div className="flex-1 p-6">
                  <div className="glass p-6 min-h-[calc(100vh-7rem)]">
                    <BreadcrumbNav />
                    <main className="mt-6">
                      <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route
                          path="/"
                          element={
                            <ProtectedRoute>
                              <Index />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/ad-wizard/:projectId"
                          element={
                            <ProtectedRoute>
                              <AdWizard />
                            </ProtectedRoute>
                          }
                        />
                      </Routes>
                    </main>
                  </div>
                </div>
              </div>
            </div>
          </BrowserRouter>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;