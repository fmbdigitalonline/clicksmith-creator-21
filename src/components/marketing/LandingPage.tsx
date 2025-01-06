import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-6">Welcome to ProfitPilot</h1>
        <p className="text-xl mb-8">Create high-converting ads with AI</p>
        <Button 
          onClick={() => navigate('/ad-wizard/new')}
          className="bg-facebook hover:bg-facebook/90"
        >
          Try It Free
        </Button>
      </div>
    </div>
  );
};

export default LandingPage;