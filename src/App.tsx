
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import Dashboard from "@/pages/Dashboard";
import AdWizard from "@/components/AdWizard";
import { FacebookCallback } from "@/components/facebook/FacebookCallback";
import { ThemeProvider } from "@/components/theme-provider";
import AuthCallback from "@/pages/auth/AuthCallback";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import PrivateRoute from "@/components/auth/PrivateRoute";
import { AuthProvider } from "@/providers/AuthProvider";
import { AppLayout } from "@/components/layout/AppLayout";
import { Index } from "@/pages/Index";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="ui-theme">
        <AuthProvider>
          <RouterProvider
            router={createBrowserRouter([
              {
                path: "/",
                element: <Index />,
              },
              {
                path: "/dashboard",
                element: <PrivateRoute><AppLayout><Dashboard /></AppLayout></PrivateRoute>,
              },
              {
                path: "/ad-wizard/:projectId",
                element: <PrivateRoute><AppLayout><AdWizard /></AppLayout></PrivateRoute>,
              },
              {
                path: "/auth/callback",
                element: <AuthCallback />,
              },
              {
                path: "/login",
                element: <Login />,
              },
              {
                path: "/register",
                element: <Register />,
              },
              {
                path: "/forgot-password",
                element: <ForgotPassword />,
              },
              {
                path: "/reset-password",
                element: <ResetPassword />,
              },
              {
                path: "/facebook-callback",
                element: <FacebookCallback />,
              },
            ])}
          />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
