import { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
} from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';

import { Shell } from '@/components/Shell';
import { Pricing } from '@/components/Pricing';
import { LandingPage } from '@/components/LandingPage';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Projects } from '@/components/projects/Projects';
import { Project } from '@/components/projects/Project';
import { AccountSettings } from '@/components/settings/AccountSettings';
import { FacebookCallback } from "@/components/facebook/FacebookCallback";

const AppRouter = () => {
  const { isSignedIn, isLoaded } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    const handleAuth = async () => {
      if (isSignedIn) {
        // sync the user to supabase
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'github',
          token: '',
        });

        if (error) {
          toast({
            title: 'Authentication error',
            description: 'There was an error signing you in.',
            variant: 'destructive',
          });
        } else {
          // redirect to projects page
          navigate('/projects');
        }
      } else {
        // redirect to landing page
        navigate('/');
      }
    };

    handleAuth();
  }, [isSignedIn, isLoaded, navigate, toast]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route
        path="/projects"
        element={
          <RequireAuth>
            <Shell>
              <Projects />
            </Shell>
          </RequireAuth>
        }
      />
      <Route
        path="/projects/:projectId"
        element={
          <RequireAuth>
            <Shell>
              <Project />
            </Shell>
          </RequireAuth>
        }
      />
      <Route
        path="/account-settings"
        element={
          <RequireAuth>
            <Shell>
              <AccountSettings />
            </Shell>
          </RequireAuth>
        }
      />
      <Route path="/facebook-callback" element={<FacebookCallback />} />
    </Routes>
  );
};

export const App = () => {
  return (
    <Router>
      <AppRouter />
    </Router>
  );
};
