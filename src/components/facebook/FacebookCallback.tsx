
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function FacebookCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");
      const state = searchParams.get("state");
      
      if (!code || !state) {
        toast({
          title: "Authentication Failed",
          description: "Missing required parameters",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('facebook-auth', {
          body: { code, state }
        });

        if (error) throw error;

        toast({
          title: "Success!",
          description: "Successfully connected to Facebook Ads",
        });

        navigate("/dashboard");
      } catch (error) {
        console.error('Facebook callback error:', error);
        toast({
          title: "Connection Failed",
          description: "Failed to complete Facebook connection",
          variant: "destructive",
        });
        navigate("/dashboard");
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [searchParams, navigate, toast]);

  if (isProcessing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Connecting to Facebook</h2>
          <p className="text-gray-600">Please wait while we complete the connection...</p>
        </div>
      </div>
    );
  }

  return null;
}
