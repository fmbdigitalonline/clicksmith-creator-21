import LandingNav from "@/components/LandingNav";
import { Button } from "@/components/ui/button";
import { Share2, Facebook, Twitter, Linkedin, Mail } from "lucide-react";

const Share = () => {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <div className="container mx-auto px-4 pt-24">
        <h1 className="text-4xl font-bold mb-6">Share & Earn</h1>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center mb-8">
              <Share2 className="w-12 h-12 mx-auto mb-4 text-primary" />
              <h2 className="text-2xl font-semibold mb-2">Share Viable with Your Network</h2>
              <p className="text-gray-600">
                Help others discover the power of AI-driven market validation and earn rewards for every referral.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="p-6 border rounded-lg">
                <h3 className="font-semibold mb-2">Share Your Link</h3>
                <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                  <input
                    type="text"
                    value="https://viable.ai/ref/123456"
                    className="flex-1 bg-transparent border-none focus:outline-none text-sm"
                    readOnly
                  />
                  <Button variant="ghost" size="sm">
                    Copy
                  </Button>
                </div>
              </div>

              <div className="p-6 border rounded-lg">
                <h3 className="font-semibold mb-2">Your Rewards</h3>
                <p className="text-gray-600 text-sm">
                  Earn 20% commission on all referral purchases for the first 3 months.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-center mb-4">Share on Social Media</h3>
              <div className="flex justify-center gap-4">
                <Button variant="outline" size="lg" className="flex items-center gap-2">
                  <Facebook className="w-4 h-4" />
                  Facebook
                </Button>
                <Button variant="outline" size="lg" className="flex items-center gap-2">
                  <Twitter className="w-4 h-4" />
                  Twitter
                </Button>
                <Button variant="outline" size="lg" className="flex items-center gap-2">
                  <Linkedin className="w-4 h-4" />
                  LinkedIn
                </Button>
                <Button variant="outline" size="lg" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Share;
