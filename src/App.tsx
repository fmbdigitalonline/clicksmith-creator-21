
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { SidebarProvider } from "@/components/ui/sidebar";
import { OnboardingDialog } from "@/components/onboarding/OnboardingDialog";
import Login from "@/pages/Login";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import Projects from "@/pages/Projects";
import Settings from "@/pages/Settings";
import Pricing from "@/pages/Pricing";
import Contact from "@/pages/Contact";
import AdWizard from "@/components/AdWizard";
import Dashboard from "@/pages/Dashboard";
import { SavedAdsGallery } from "@/components/gallery/SavedAdsGallery";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Index from "@/pages/Index";
import LandingPage from "@/pages/LandingPage";
import LandingPages from "@/pages/LandingPages";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/" element={<Index />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
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
              path="/projects/:projectId/landing-page"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LandingPage />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/landing-pages"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <LandingPages />
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
              path="/saved-ads"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <SavedAdsGallery />
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <OnboardingDialog />
          <Toaster />
        </Router>
      </SidebarProvider>
    </QueryClientProvider>
  );
}

export default App;
