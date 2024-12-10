import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CookiesProvider } from "react-cookie";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import AdWizard from "./components/AdWizard";
import Projects from "./pages/Projects";
import Settings from "./pages/Settings";

const App = () => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <CookiesProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <SidebarProvider>
            <div className="min-h-screen flex w-full bg-gradient-radial from-background via-background to-secondary/20">
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <Index />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/ad-wizard/:projectId"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <AdWizard />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/projects"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <Projects />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/settings"
                    element={
                      <ProtectedRoute>
                        <AppLayout>
                          <Settings />
                        </AppLayout>
                      </ProtectedRoute>
                    }
                  />
                </Routes>
              </BrowserRouter>
            </div>
          </SidebarProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </CookiesProvider>
  );
};

export default App;