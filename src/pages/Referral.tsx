
import LandingNav from "@/components/LandingNav";
import IndexFooter from "@/components/IndexFooter";
import { Button } from "@/components/ui/button";
import { Copy, Users, Battery, Share2, Award } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Referral = () => {
  const { toast } = useToast();
  const referralLink = "https://yourapp.com/referral/unique-code";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LandingNav />
      <div className="container mx-auto px-4 pt-24 flex-grow">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Refer & Earn Credits</h1>
            <p className="text-xl text-gray-600">
              Invite friends to Viable and earn credits for every successful referral
            </p>
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <Users className="w-8 h-8 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Total Referrals</h3>
              <p className="text-3xl font-bold text-primary">0</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <Battery className="w-8 h-8 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Credits Earned</h3>
              <p className="text-3xl font-bold text-primary">0</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <Award className="w-8 h-8 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Reward Level</h3>
              <p className="text-3xl font-bold text-primary">Bronze</p>
            </div>
          </div>

          {/* Referral Link Section */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-12">
            <h2 className="text-2xl font-semibold mb-6">Your Referral Link</h2>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg mb-4">
              <input
                type="text"
                value={referralLink}
                className="flex-1 bg-transparent border-none focus:outline-none font-mono text-sm"
                readOnly
              />
              <Button onClick={handleCopyLink} variant="outline" size="sm">
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </Button>
            </div>
            <div className="flex justify-center gap-4">
              <Button variant="outline" size="lg" className="flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Share via Email
              </Button>
            </div>
          </div>

          {/* How it Works Section */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-12">
            <h2 className="text-2xl font-semibold mb-6">How It Works</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold">1</span>
                </div>
                <h3 className="font-semibold mb-2">Share Your Link</h3>
                <p className="text-gray-600">Share your unique referral link with friends and colleagues</p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold">2</span>
                </div>
                <h3 className="font-semibold mb-2">Friends Sign Up</h3>
                <p className="text-gray-600">When they sign up using your link, they get 2 bonus credits</p>
              </div>
              <div className="text-center">
                <div className="bg-primary/10 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold">3</span>
                </div>
                <h3 className="font-semibold mb-2">Earn Credits</h3>
                <p className="text-gray-600">Receive 2 credits for each successful referral</p>
              </div>
            </div>
          </div>

          {/* Rewards Section */}
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold mb-6">Referral Program Details</h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <Award className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">For You</h3>
                  <p className="text-gray-600">Earn 2 credits for each successful referral</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <Award className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">For Your Friends</h3>
                  <p className="text-gray-600">They receive 2 bonus credits when signing up with your link</p>
                </div>
              </div>
              <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                <Award className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">No Limits</h3>
                  <p className="text-gray-600">Refer as many friends as you want - there's no cap on how many credits you can earn!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <IndexFooter />
    </div>
  );
};

export default Referral;
