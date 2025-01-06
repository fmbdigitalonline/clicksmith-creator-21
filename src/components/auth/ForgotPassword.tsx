import { Auth } from '@supabase/auth-ui-react'
import { supabase } from '@/integrations/supabase/client'
import { ThemeSupa } from '@supabase/auth-ui-shared'

const ForgotPassword = () => {
  return (
    <div className="container max-w-md mx-auto mt-12 p-4">
      <h1 className="text-2xl font-bold mb-6">Reset Password</h1>
      <Auth
        supabaseClient={supabase}
        appearance={{ theme: ThemeSupa }}
        theme="light"
        providers={[]}
        view="forgotten_password"
      />
    </div>
  );
};

export default ForgotPassword;