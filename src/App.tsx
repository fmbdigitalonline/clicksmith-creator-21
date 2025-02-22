
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppLayout } from "@/components/layout/AppLayout";

// Public Pages
import Index from "@/pages/Index";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import Pricing from "@/pages/Pricing";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import FAQ from "@/pages/FAQ";
import Help from "@/pages/Help";
import Careers from "@/pages/Careers";
import Affiliate from "@/pages/Affiliate";
import Referral from "@/pages/Referral";
import Share from "@/pages/Share";
import Login from "@/pages/Login";

// Protected Pages
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import Settings from "@/pages/Settings";
import LandingPages from "@/pages/LandingPages";
import LandingPage from "@/pages/LandingPage";
import SavedAds from "@/pages/SavedAds";
import AdWizard from "@/components/AdWizard";

// Admin Pages
import BlogAdmin from "@/pages/BlogAdmin";

import "./App.css";

const queryClient = new QueryClient();

// Layout wrapper for protected routes
const ProtectedLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <Router>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPost />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/help" element={<Help />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/affiliate" element={<Affiliate />} />
            <Route path="/referral" element={<Referral />} />
            <Route path="/share" element={<Share />} />
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedLayout>
                  <Dashboard />
                </ProtectedLayout>
              }
            />
            <Route
              path="/projects"
              element={
                <ProtectedLayout>
                  <Projects />
                </ProtectedLayout>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedLayout>
                  <Settings />
                </ProtectedLayout>
              }
            />
            <Route
              path="/landing-pages"
              element={
                <ProtectedLayout>
                  <LandingPages />
                </ProtectedLayout>
              }
            />
            <Route
              path="/landing-page/:id"
              element={
                <ProtectedLayout>
                  <LandingPage />
                </ProtectedLayout>
              }
            />
            <Route
              path="/saved-ads"
              element={
                <ProtectedLayout>
                  <SavedAds />
                </ProtectedLayout>
              }
            />
            <Route
              path="/ad-wizard/*"
              element={
                <ProtectedLayout>
                  <AdWizard />
                </ProtectedLayout>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/blog/admin"
              element={
                <AdminRoute>
                  <AppLayout>
                    <BlogAdmin />
                  </AppLayout>
                </AdminRoute>
              }
            />
          </Routes>
          <Toaster />
        </Router>
      </SidebarProvider>
    </QueryClientProvider>
  );
}

export default App;
