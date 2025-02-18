
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle OAuth callback logic here if needed
    navigate("/");
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p>Processing authentication...</p>
    </div>
  );
}
