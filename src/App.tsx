
import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { Toaster } from "./components/ui/toaster";
import { supabase } from "./integrations/supabase/client";
import "./App.css";

// Lazy-loaded pages
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Projects = lazy(() => import('./pages/Projects'));
const AdWizard = lazy(() => import('./components/AdWizard'));
const Settings = lazy(() => import('./pages/Settings'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Index = lazy(() => import('./pages/Index'));
const Help = lazy(() => import('./pages/Help'));
const About = lazy(() => import('./pages/About'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const Contact = lazy(() => import('./pages/Contact'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogPost = lazy(() => import('./pages/BlogPost'));
const LandingPages = lazy(() => import('./pages/LandingPages'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const Referral = lazy(() => import('./pages/Referral'));
const Share = lazy(() => import('./pages/Share'));
const FacebookAds = lazy(() => import('./pages/FacebookAds'));

// Admin pages
const AdminRoute = lazy(() => import('./components/auth/AdminRoute').then(module => ({ default: module.AdminRoute })));
const BlogAdmin = lazy(() => import('./pages/BlogAdmin'));
const AdminUpdates = lazy(() => import('./pages/AdminUpdates'));
const Affiliate = lazy(() => import('./pages/Affiliate'));

function App() {
  useEffect(() => {
    // Remove devTools import since it doesn't exist
    // We'll just have a basic check for dev mode instead
    if (import.meta.env.DEV) {
      console.log('Running in development mode');
    }
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/about" element={<About />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/help" element={<Help />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/lp/:id" element={<LandingPage />} />
          <Route path="/share/:id" element={<Share />} />
          <Route path="/affiliate" element={<Affiliate />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:projectId" element={<Projects />} />
            <Route path="/ad-wizard/:projectId" element={<AdWizard />} />
            <Route path="/facebook-ads/:projectId" element={<FacebookAds />} />
            <Route path="/landing-pages" element={<LandingPages />} />
            <Route path="/landing-pages/:id" element={<LandingPages />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/refer" element={<Referral />} />
            
            {/* Admin routes */}
            <Route path="/admin/blog" element={<AdminRoute><BlogAdmin /></AdminRoute>} />
            <Route path="/admin/updates" element={<AdminRoute><AdminUpdates /></AdminRoute>} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      
      <Toaster />
    </BrowserRouter>
  );
}

export default App;
