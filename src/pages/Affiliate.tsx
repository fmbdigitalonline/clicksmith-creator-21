
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, BadgeCheck, Rocket, ArrowRight } from "lucide-react";

const Affiliate = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6 flex items-center gap-2">
        <DollarSign className="h-8 w-8 text-primary" />
        Affiliate Program
      </h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              30% Commission
            </CardTitle>
            <CardDescription>Earn for every referred sale</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Earn 30% commission on all referral sales, paid out monthly.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BadgeCheck className="h-5 w-5 text-primary" />
              Lifetime Attribution
            </CardTitle>
            <CardDescription>Long-term earnings</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Earn from all future purchases made by your referred customers.</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              Instant Approval
            </CardTitle>
            <CardDescription>Start earning today</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Get approved instantly and start promoting right away.</p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>How to Get Started</CardTitle>
          <CardDescription>Follow these simple steps to begin earning</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-4">
            <li className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-2 text-primary font-bold">1</div>
              <div>
                <h3 className="font-semibold">Sign Up as an Affiliate</h3>
                <p className="text-muted-foreground">Complete the registration form to join our program</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-2 text-primary font-bold">2</div>
              <div>
                <h3 className="font-semibold">Get Your Unique Links</h3>
                <p className="text-muted-foreground">Access your dashboard to get your affiliate links and materials</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="rounded-full bg-primary/10 p-2 text-primary font-bold">3</div>
              <div>
                <h3 className="font-semibold">Start Promoting</h3>
                <p className="text-muted-foreground">Share your links and start earning commissions</p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button size="lg" className="gap-2">
          Apply Now <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default Affiliate;
