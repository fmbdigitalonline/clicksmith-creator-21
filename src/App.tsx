import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Dashboard from "@/pages/Dashboard";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import Login from "@/pages/Login";
import Index from "@/pages/Index";
import AdWizard from "@/pages/AdWizard";
import Gallery from "@/pages/Gallery";
import Projects from "@/pages/Projects";
import ProjectDetail from "@/pages/ProjectDetail";
import Settings from "@/pages/Settings";
import Pricing from "@/pages/Pricing";
import Tutorials from "@/pages/Tutorials";
import FAQ from "@/pages/FAQ";
import Contact from "@/pages/Contact";
import Feedback from "@/pages/Feedback";
import AdDetail from "@/pages/AdDetail";
import LandingPage from "@/pages/LandingPage";
import NotFound from "@/pages/NotFound";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ad-wizard"
          element={
            <ProtectedRoute>
              <AdWizard />
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
        <Route
          path="/gallery"
          element={
            <ProtectedRoute>
              <Gallery />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects"
          element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:projectId"
          element={
            <ProtectedRoute>
              <ProjectDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pricing"
          element={
            <ProtectedRoute>
              <Pricing />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tutorials"
          element={
            <ProtectedRoute>
              <Tutorials />
            </ProtectedRoute>
          }
        />
        <Route
          path="/faq"
          element={
            <ProtectedRoute>
              <FAQ />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contact"
          element={
            <ProtectedRoute>
              <Contact />
            </ProtectedRoute>
          }
        />
        <Route
          path="/feedback"
          element={
            <ProtectedRoute>
              <Feedback />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ad-detail/:adId"
          element={
            <ProtectedRoute>
              <AdDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/landing-page/:landingPageId"
          element={
            <ProtectedRoute>
              <LandingPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
};

export default App;
