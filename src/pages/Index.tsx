
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, MessageCircle, BadgeCheck } from "lucide-react";

const Index = () => {
  const features = [
    "Instant ICP Generation",
    "Multi-Platform Ad Creation",
    "A/B Testing Made Easy",
    "Real-Time Analytics",
    "Cost-Effective Validation"
  ];

  const howItWorks = [
    {
      title: "Describe Your Idea",
      description: "Enter a brief description of your business idea, product, or service. No technical jargon required—just tell us what you're passionate about!"
    },
    {
      title: "AI Generates Your ICP",
      description: "Instantly get a detailed Ideal Customer Profile, including demographics, pain points, motivations, and buying behaviors."
    },
    {
      title: "Create Social Media Ads",
      description: "Our AI crafts tailored ad copy and visuals for Facebook, Instagram, LinkedIn, TikTok, and more."
    },
    {
      title: "Test & Validate",
      description: "Use the generated ads to run low-cost campaigns and gather real-world data before investing heavily."
    }
  ];

  const testimonials = [
    {
      quote: "I used Viable to test my subscription box idea, and within a week, I knew exactly who my target audience was and which ads drove the most interest. It's a game-changer!",
      author: "Sarah T.",
      role: "Entrepreneur"
    },
    {
      quote: "Before using Viable, I spent months trying to figure out my target market and crafting ads that didn't work. Now, I have a clear roadmap and proven strategies to grow my business.",
      author: "John D.",
      role: "Small Business Owner"
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-8">
            The Ultimate Tool to Validate Your Business Idea in Minutes
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Got a Business Idea? Test It Instantly with AI-Powered ICP & Ad Generation!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <Link to="/login">
                Start Now for Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/pricing">
                View Pricing
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-accent/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Our Platform?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-3 p-4 bg-background rounded-lg shadow-sm">
                <CheckCircle className="h-5 w-5 text-primary" />
                <span className="font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {howItWorks.map((step, index) => (
              <div key={step.title} className="p-6 bg-accent/5 rounded-lg">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl mb-2">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-accent/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            What Our Users Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.author} className="p-6 bg-background rounded-lg shadow-sm">
                <MessageCircle className="h-8 w-8 text-primary mb-4" />
                <blockquote className="text-lg mb-4">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-medium">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Validate Your Business Idea?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Get started with 12 free generations. No credit card required.
          </p>
          <Button size="lg" asChild>
            <Link to="/login">
              Start Now for Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-muted-foreground">
            © {new Date().getFullYear()} Viable | Privacy Policy | Terms of Service
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
