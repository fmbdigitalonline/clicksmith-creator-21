
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, MessageCircle, BadgeCheck, Target, ArrowRight as ArrowRightIcon, Lightbulb, PieChart, DollarSign, Users, BarChart } from "lucide-react";

const Index = () => {
  const howItWorks = [
    {
      title: "Describe Your Idea",
      description: "The first step is the easiest: just tell us about your business idea. Whether you're launching a new app, creating a subscription box, offering consulting services, or selling physical products, our AI understands it all. You don't need to be a marketing expert or have any technical knowledge—just describe your concept in plain language."
    },
    {
      title: "AI Generates Your ICP",
      description: "Once you've described your idea, our advanced AI algorithms go to work. Within seconds, you'll receive a detailed Ideal Customer Profile (ICP). This isn't just a generic list of demographics; it's a comprehensive analysis of who your target audience is, including their pain points, motivations, buying behaviors, and even the platforms they frequent most."
    },
    {
      title: "Create Social Media Ads",
      description: "After generating your ICP, our AI crafts tailored ad copy and visuals for multiple platforms, including Facebook, Instagram, LinkedIn, TikTok, Twitter, and Pinterest. Each ad is designed to capture attention and drive engagement, based on the preferences and behaviors of your ideal customer."
    },
    {
      title: "Test & Validate",
      description: "Now comes the fun part: testing your ideas in the real world. Use the generated ads to run low-cost campaigns on your chosen platforms. This allows you to gather real-world data and see which messages, visuals, and platforms drive the most engagement."
    }
  ];

  const features = [
    {
      icon: Target,
      title: "Instant ICP Generation",
      description: "Get a clear picture of your ideal customer in seconds. Our AI uses advanced algorithms and industry data to create highly accurate profiles."
    },
    {
      icon: ArrowRightIcon,
      title: "Multi-Platform Ad Creation",
      description: "Tailored ads for Facebook, Instagram, LinkedIn, TikTok, Twitter, and Pinterest. Each ad is designed to capture attention and drive engagement."
    },
    {
      icon: PieChart,
      title: "A/B Testing Made Easy",
      description: "Test multiple ad variations to see what works best. Our platform makes it simple to compare performance metrics."
    },
    {
      icon: BarChart,
      title: "Real-Time Analytics",
      description: "Track engagement and performance across platforms. Get real-time insights into key metrics like click-through rates and ROI."
    },
    {
      icon: DollarSign,
      title: "Cost-Effective Validation",
      description: "Save thousands on market research and ad testing. Validate your business idea on a small scale before investing heavily."
    }
  ];

  const painPoints = [
    {
      icon: Users,
      title: "Difficulty Identifying the Right Target Audience",
      description: "Without a clear understanding of your ideal customer, your marketing efforts are likely to fall flat. Our AI-generated ICPs take the guesswork out of audience targeting."
    },
    {
      icon: Lightbulb,
      title: "Overwhelm from Too Many Tools and Platforms",
      description: "The digital marketing world is flooded with tools. We consolidate everything you need into one platform—ICP generation, ad creation, and performance tracking."
    },
    {
      icon: DollarSign,
      title: "Fear of Wasting Money on Ineffective Campaigns",
      description: "With our platform, you can test your ads on a small scale before committing significant resources. Save thousands on market research and ad testing."
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
    },
    {
      quote: "Running a small business means wearing many hats, and marketing was always my weakest area. Viable has given me the confidence to launch targeted campaigns without feeling overwhelmed.",
      author: "Emily R.",
      role: "Freelancer"
    }
  ];

  const faq = [
    {
      question: "How accurate is the ICP generation?",
      answer: "Our AI uses advanced algorithms and industry data to create highly accurate customer profiles. However, we recommend supplementing with real-world testing for best results."
    },
    {
      question: "Can I customize the generated ads?",
      answer: "Absolutely! You can tweak the ad copy, visuals, and targeting to match your brand's voice and style."
    },
    {
      question: "Which social media platforms are supported?",
      answer: "We support Facebook, Instagram, LinkedIn, TikTok, Twitter, and Pinterest."
    },
    {
      question: "Is there a free trial?",
      answer: "Yes! You can generate 12 free ICPs and ad sets to test the platform."
    }
  ];

  const concerns = [
    {
      title: "Will the Ads Reflect My Brand?",
      description: "Absolutely! While our AI generates the initial ad copy and visuals, you have full control to customize them to match your brand's voice and style."
    },
    {
      title: "Can Automated Solutions Really Work?",
      description: "Our platform is designed to complement your creativity, not replace it. The AI provides a solid foundation, but your insights and expertise make the campaigns truly shine."
    },
    {
      title: "Is There a Steep Learning Curve?",
      description: "Not at all! Our platform is designed to be intuitive and user-friendly. Our step-by-step guides and support team are here to help you."
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
          <p className="text-xl text-muted-foreground mb-6 max-w-3xl mx-auto">
            In today's fast-paced digital world, establishing a strong online presence is no longer optional—it's essential. But how do you know if your business idea will resonate with your target audience?
          </p>
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Simply describe your business idea, and our AI generates your Ideal Customer Profile (ICP) and high-converting social media ads for all platforms—so you can see what works, what sticks, and what flops—before you even launch.
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

      {/* How It Works Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            How It Works
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            We understand that the process of validating a business idea can seem daunting. That's why we've designed our platform to be as simple and intuitive as possible.
          </p>
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

      {/* Features Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-accent/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Our Platform?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="p-6 bg-background rounded-lg shadow-sm">
                <feature.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold text-xl mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Deep Pain Points: Solving Your Biggest Challenges
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            Let's dive deeper into some of the specific challenges that entrepreneurs and marketers face when trying to validate a business idea—and how we address them.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {painPoints.map((point) => (
              <div key={point.title} className="p-6 bg-accent/5 rounded-lg">
                <point.icon className="h-8 w-8 text-primary mb-4" />
                <h3 className="font-semibold text-xl mb-2">{point.title}</h3>
                <p className="text-muted-foreground">{point.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-accent/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Don't Just Take Our Word for It
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

      {/* Concerns Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Concerns We Address
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            We understand that trying a new tool can be intimidating. Here's how we address common concerns:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {concerns.map((concern) => (
              <div key={concern.title} className="p-6 bg-accent/5 rounded-lg">
                <h3 className="font-semibold text-xl mb-2">{concern.title}</h3>
                <p className="text-muted-foreground">{concern.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-accent/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {faq.map((item) => (
              <div key={item.question} className="p-6 bg-background rounded-lg shadow-sm">
                <h3 className="font-semibold text-xl mb-2">{item.question}</h3>
                <p className="text-muted-foreground">{item.answer}</p>
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
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold mb-4">Contact Us</h3>
              <p className="text-muted-foreground">📞 support@viable.com</p>
              <p className="text-muted-foreground">📧 Subscribe to our newsletter for updates</p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link to="/pricing" className="block text-muted-foreground hover:text-primary">
                  Pricing
                </Link>
                <Link to="/login" className="block text-muted-foreground hover:text-primary">
                  Sign Up
                </Link>
                <a href="#" className="block text-muted-foreground hover:text-primary">
                  Privacy Policy
                </a>
                <a href="#" className="block text-muted-foreground hover:text-primary">
                  Terms of Service
                </a>
              </div>
            </div>
          </div>
          <div className="text-center text-muted-foreground border-t pt-8">
            © {new Date().getFullYear()} Viable. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
