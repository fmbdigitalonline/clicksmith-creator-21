import {
  createBrowserRouter,
  RouterProvider,
  Route,
  createRoutesFromElements,
} from "react-router-dom";
import { useSession } from "@supabase/auth-helpers-react";

import App from "./App";
import AuthGuard from "./components/AuthGuard";
import Account from "./pages/Account";
import Pricing from "./pages/Pricing";
import Integrations from "./pages/Integrations";
import AdWizard from "./pages/AdWizard";
import Project from "./pages/Project";
import NotFound from "./pages/NotFound";
import DiagnosticPage from "./pages/DiagnosticPage";

const Router = () => {
  const session = useSession();

  const router = createBrowserRouter(
    createRoutesFromElements(
      <>
        <Route path="/" element={<App />} />
        <Route
          path="/account"
          element={
            <AuthGuard>
              <Account />
            </AuthGuard>
          }
        />
        <Route path="/pricing" element={<Pricing />} />
        <Route
          path="/integrations"
          element={
            <AuthGuard>
              <Integrations />
            </AuthGuard>
          }
        />
        <Route
          path="/wizard"
          element={
            <AuthGuard>
              <AdWizard />
            </AuthGuard>
          }
        />
        <Route
          path="/project/:projectId"
          element={
            <AuthGuard>
              <Project />
            </AuthGuard>
          }
        />
        <Route
          path="/diagnostic"
          element={
            <AuthGuard>
              <DiagnosticPage />
            </AuthGuard>
          }
        />
        <Route path="*" element={<NotFound />} />
      </>
    )
  );

  return <RouterProvider router={router} />;
};

export default Router;
