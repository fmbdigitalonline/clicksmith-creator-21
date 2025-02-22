
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

const FAQ = () => {
  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Frequently Asked Questions</h1>
        
        <Tabs defaultValue="getting-started" className="space-y-6">
          <TabsList className="w-full flex flex-wrap justify-start gap-2">
            <TabsTrigger value="getting-started">Getting Started</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="ad-creation">Ad Creation</TabsTrigger>
            <TabsTrigger value="landing-pages">Landing Pages</TabsTrigger>
            <TabsTrigger value="social-media">Social Media</TabsTrigger>
            <TabsTrigger value="credits">Credits & Billing</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
          </TabsList>

          <TabsContent value="getting-started">
            <div className="grid gap-4">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">How do I get started with Viable?</h3>
                  <p className="text-muted-foreground">Create an account, complete the onboarding process where you'll specify your user type (business owner, creator, or affiliate), and you'll be ready to create your first project.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">What can I create with Viable?</h3>
                  <p className="text-muted-foreground">You can create AI-powered ad campaigns, landing pages, and social media content. Our platform helps you generate engaging content tailored to your target audience.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="projects">
            <div className="grid gap-4">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">How do I create a new project?</h3>
                  <p className="text-muted-foreground">Click on the "New Project" button in your dashboard, enter your project details, and choose your project type. You can then start creating content within your project.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">Can I collaborate with others on my projects?</h3>
                  <p className="text-muted-foreground">Currently, projects are individual, but you can export and share your generated content with team members through our sharing features.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="ad-creation">
            <div className="grid gap-4">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">How does the Ad Wizard work?</h3>
                  <p className="text-muted-foreground">The Ad Wizard guides you through defining your business idea, identifying target audiences, and generating customized ad content. It uses AI to create variations optimized for different platforms.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">What ad formats are supported?</h3>
                  <p className="text-muted-foreground">We support various formats for Facebook, Google, and LinkedIn ads, including image ads, carousel ads, and text ads. Each format is optimized for the specific platform.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="landing-pages">
            <div className="grid gap-4">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">How do I create a landing page?</h3>
                  <p className="text-muted-foreground">Navigate to the Landing Pages section, click "Create New," and follow our step-by-step wizard. You can customize sections, add content, and preview your page before publishing.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="social-media">
            <div className="grid gap-4">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">How do I connect my Facebook account?</h3>
                  <p className="text-muted-foreground">Go to Settings, select "Connected Accounts," and click on "Connect Facebook." Follow the authentication process to link your account.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="credits">
            <div className="grid gap-4">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">How do credits work?</h3>
                  <p className="text-muted-foreground">Credits are used to generate AI content. Each generation consumes one credit. You can purchase credits through our pricing plans or earn them through referrals.</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">How do I purchase more credits?</h3>
                  <p className="text-muted-foreground">Visit our Pricing page to view available plans and purchase credits. You can choose from monthly subscriptions or one-time purchases.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="referrals">
            <div className="grid gap-4">
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold mb-2">How does the referral program work?</h3>
                  <p className="text-muted-foreground">Share your unique referral link with others. When they sign up and make a purchase, you'll earn bonus credits. The more people you refer, the more credits you earn.</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Contact Support CTA */}
        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="py-6">
              <h3 className="text-lg font-semibold mb-2">Can't find what you're looking for?</h3>
              <p className="text-muted-foreground mb-4">Our support team is here to help you with any questions you may have.</p>
              <Button asChild>
                <Link to="/contact" className="inline-flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Contact Support
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default FAQ;
