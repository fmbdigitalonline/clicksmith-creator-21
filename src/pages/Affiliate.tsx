import LandingNav from "@/components/LandingNav";
import IndexFooter from "@/components/IndexFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DollarSign, Users, ArrowRight, BadgeCheck } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Affiliate = () => {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('affiliate_applications')
        .insert([
          {
            user_id: user?.id,
            email,
            website,
            description
          }
        ]);

      if (error) throw error;

      toast({
        title: "Application Received!",
        description: "We'll review your application and get back to you soon.",
      });

      // Clear form
      setEmail("");
      setWebsite("");
      setDescription("");
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <LandingNav />
      <div className="container mx-auto px-4 pt-24 flex-grow">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary/80 to-primary bg-clip-text text-transparent">
              Affiliate Program
            </h1>
            <p className="text-xl text-muted-foreground">
              Partner with us and earn 20% commission on every successful referral
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <DollarSign className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">20% Commission</h3>
                    <p className="text-muted-foreground">One-time payment per referral</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">30-Day Cookie</h3>
                    <p className="text-muted-foreground">Extended attribution window</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <BadgeCheck className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Instant Approval</h3>
                    <p className="text-muted-foreground">Quick application process</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* How it Works */}
          <Card className="mb-12">
            <CardHeader>
              <CardTitle>How it Works</CardTitle>
              <CardDescription>Simple steps to start earning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    1
                  </div>
                  <div>
                    <h3 className="font-semibold">Apply to become an affiliate</h3>
                    <p className="text-muted-foreground">Fill out our simple application form below</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    2
                  </div>
                  <div>
                    <h3 className="font-semibold">Get your unique referral link</h3>
                    <p className="text-muted-foreground">Once approved, receive your personalized tracking link</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold">Earn commissions</h3>
                    <p className="text-muted-foreground">Get 20% commission for each successful referral</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Application Form */}
          <Card>
            <CardHeader>
              <CardTitle>Apply Now</CardTitle>
              <CardDescription>
                Fill out the form below to join our affiliate program
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website/Social Media</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">How will you promote us?</Label>
                  <Textarea
                    id="description"
                    placeholder="Tell us about your promotion strategy..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    disabled={isSubmitting}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <IndexFooter />
    </div>
  );
};

export default Affiliate;
