
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Share2, UsersRound } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Referral = () => {
  const { toast } = useToast();
  const referralCode = "FRIEND2024"; // This would normally come from the user's profile

  const copyReferralLink = () => {
    navigator.clipboard.writeText(`https://yourdomain.com/signup?ref=${referralCode}`);
    toast({
      title: "Referral link copied!",
      description: "Share this link with your friends to earn rewards.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6 flex items-center gap-2">
        <UsersRound className="h-8 w-8 text-primary" />
        Refer a Friend
      </h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>How it Works</CardTitle>
            <CardDescription>Earn rewards for every friend you bring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-2">
                <Share2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Share Your Link</h3>
                <p className="text-muted-foreground">Send your unique referral link to friends</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-2">
                <UsersRound className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Friends Sign Up</h3>
                <p className="text-muted-foreground">When they join using your link</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-2">
                <div className="h-6 w-6 text-primary flex items-center justify-center font-bold">$</div>
              </div>
              <div>
                <h3 className="font-semibold">Earn Rewards</h3>
                <p className="text-muted-foreground">Get credits for each successful referral</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your Referral Link</CardTitle>
            <CardDescription>Share this link to start earning</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={`https://yourdomain.com/signup?ref=${referralCode}`}
                readOnly
                className="flex-1 p-2 border rounded-md bg-muted"
              />
              <Button onClick={copyReferralLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" className="w-full">
                <Share2 className="h-4 w-4 mr-2" />
                Share on Twitter
              </Button>
              <Button variant="outline" className="w-full">
                Share on Facebook
              </Button>
              <Button variant="outline" className="w-full">
                Share on LinkedIn
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Referral;
