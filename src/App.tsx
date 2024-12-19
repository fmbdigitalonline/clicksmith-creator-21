import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { SidebarProvider } from "@/components/ui/sidebar";
import { OnboardingDialog } from "@/components/onboarding/OnboardingDialog";
import Login from "@/pages/Login";
import Projects from "@/pages/Projects";
import Settings from "@/pages/Settings";
import Pricing from "@/pages/Pricing";
import AdWizard from "@/components/AdWizard";
import Landing from "@/pages/Landing";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

function App() {
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        window.location.href = '/dashboard';
      }
    };

    if (window.location.pathname === '/') {
      checkAuth();
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Projects />
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
          </Routes>
          <OnboardingDialog />
          <Toaster />
        </Router>
      </SidebarProvider>
    </QueryClientProvider>
  );
}

export default App;