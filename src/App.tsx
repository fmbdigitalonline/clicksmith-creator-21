
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react";
import Account from "@/components/Account";
import Home from "@/components/Home";
import { AppLayout } from "@/components/layout/AppLayout"; // Changed to named import
import Integrations from "@/components/integrations/PlatformIntegrations"; // Fixed import path
import FacebookCampaignOverview from "@/components/integrations/FacebookCampaignOverview";
import CampaignDetailsView from "@/components/integrations/CampaignDetailsView";
import AdWizard from "@/components/AdWizard"; // Added missing import

function App() {
  const session = useSession();
  const supabase = useSupabaseClient();

  const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
    if (!session) {
      return <Navigate to="/login" replace />;
    }

    return children;
  };

  const AuthRoute = ({ children }: { children: JSX.Element }) => {
    if (session) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={
            <AuthRoute>
              <div className="container mx-auto py-8">
                <Auth
                  supabaseClient={supabase}
                  appearance={{ theme: ThemeSupa }}
                  providers={["google", "facebook"]}
                  redirectTo={`${window.location.origin}/`}
                />
              </div>
            </AuthRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Home />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Account session={session} />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/ad-wizard"
          element={
            <ProtectedRoute>
              <AppLayout>
                <AdWizard />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/integrations"
          element={
            <ProtectedRoute>
              <AppLayout>
                <Integrations />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/integrations/facebook"
          element={
            <ProtectedRoute>
              <AppLayout>
                <FacebookCampaignOverview />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/integrations/campaigns/:campaignId"
          element={
            <ProtectedRoute>
              <AppLayout>
                <CampaignDetailsView />
              </AppLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
