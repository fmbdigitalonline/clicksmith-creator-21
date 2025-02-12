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
          <div className="flex justify-center mb-6">
            <Target className="h-12 w-12 text-primary animate-pulse" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-8">
            The Ultimate Tool to Validate Your Business Idea in Minutes
          </h1>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-12">
            <div className="flex items-center gap-2 text-xl text-muted-foreground">
              <CheckCircle className="h-6 w-6 text-primary" />
              <span>AI-Powered Analysis</span>
            </div>
            <div className="flex items-center gap-2 text-xl text-muted-foreground">
              <CheckCircle className="h-6 w-6 text-primary" />
              <span>Multi-Platform Support</span>
            </div>
            <div className="flex items-center gap-2 text-xl text-muted-foreground">
              <CheckCircle className="h-6 w-6 text-primary" />
              <span>Real-Time Results</span>
            </div>
          </div>
          <p className="text-xl text-muted-foreground mb-6 max-w-3xl mx-auto">
            In today's fast-paced digital world, establishing a strong online presence is no longer optional—it's essential. But how do you know if your business idea will resonate with your target audience?
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

      {/* Video Explainer Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-accent/5">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">See How It Works</h2>
          <div className="aspect-video bg-black/5 rounded-lg overflow-hidden mb-8">
            <iframe 
              className="w-full h-full"
              src="https://www.youtube.com/embed/placeholder"
              title="Product Demo"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            ></iframe>
          </div>
          <p className="text-muted-foreground">
            Watch our 2-minute demo to see how easy it is to validate your business idea
          </p>
        </div>
      </section>

      {/* Platform Preview Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            See the Platform in Action
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            Our intuitive interface makes it easy to validate your business idea and create high-converting ads
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="bg-accent/5 p-6 rounded-lg">
                <h3 className="font-semibold text-xl mb-4 flex items-center gap-2">
                  <Target className="h-6 w-6 text-primary" />
                  ICP Generation Dashboard
                </h3>
                <p className="text-muted-foreground">
                  Get detailed insights about your ideal customer profile, including demographics, behaviors, and preferences.
                </p>
              </div>
              <div className="bg-accent/5 p-6 rounded-lg">
                <h3 className="font-semibold text-xl mb-4 flex items-center gap-2">
                  <BarChart className="h-6 w-6 text-primary" />
                  Real-Time Analytics
                </h3>
                <p className="text-muted-foreground">
                  Track your ad performance across all platforms in one unified dashboard.
                </p>
              </div>
            </div>
            <div className="relative rounded-lg overflow-hidden shadow-xl">
              <img
                src="/placeholder.svg"
                alt="ICP Dashboard"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Ad Creation Showcase */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-accent/5">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative rounded-lg overflow-hidden shadow-xl order-2 lg:order-1">
              <img
                src="/placeholder.svg"
                alt="Ad Creation Interface"
                className="w-full h-auto"
              />
            </div>
            <div className="space-y-6 order-1 lg:order-2">
              <h2 className="text-3xl font-bold mb-4">
                Create Stunning Ads in Minutes
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">AI-Powered Ad Generation</h3>
                    <p className="text-muted-foreground">Generate multiple ad variations optimized for each platform.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Multi-Platform Support</h3>
                    <p className="text-muted-foreground">Create ads for Facebook, Instagram, LinkedIn, and more.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Custom Branding</h3>
                    <p className="text-muted-foreground">Easily customize ads to match your brand identity.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Results Showcase */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold mb-4">
                Track Your Success
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <PieChart className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Comprehensive Analytics</h3>
                    <p className="text-muted-foreground">Monitor engagement, clicks, and conversions across all platforms.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BarChart className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h3 className="font-semibold mb-1">Performance Insights</h3>
                    <p className="text-muted-foreground">Get detailed reports on which ads and platforms perform best.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative rounded-lg overflow-hidden shadow-xl">
              <img
                src="/placeholder.svg"
                alt="Analytics Dashboard"
                className="w-full h-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Visual Steps Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {howItWorks.map((step, index) => (
              <div key={step.title} className="relative">
                {index < howItWorks.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-6 transform -translate-y-1/2">
                    <ArrowRight className="h-8 w-8 text-primary/30" />
                  </div>
                )}
                <div className="bg-accent/5 rounded-lg p-8 h-full">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-xl mb-4">{step.title}</h3>
                      <ul className="space-y-2">
                        {step.description.split('. ').map((point, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                            <span className="text-muted-foreground">{point}.</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid with Images */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-accent/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why Choose Our Platform?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={feature.title} className="group bg-background rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-video bg-primary/5 flex items-center justify-center p-8">
                  <feature.icon className="h-16 w-16 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <div className="p-6">
                  <h3 className="font-semibold text-xl mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visual Pain Points */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Deep Pain Points: Solving Your Biggest Challenges
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            Let's dive deeper into some of the specific challenges that entrepreneurs and marketers face.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {painPoints.map((point) => (
              <div key={point.title} className="bg-accent/5 rounded-lg p-6 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                  <point.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold text-xl mb-4">{point.title}</h3>
                <p className="text-muted-foreground">{point.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Testimonials */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-accent/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Don't Just Take Our Word for It
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <div key={testimonial.author} className="bg-background rounded-lg shadow-sm p-6 relative">
                <div className="absolute -top-4 left-6">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <MessageCircle className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <blockquote className="text-lg mb-6">
                  "{testimonial.quote}"
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <BadgeCheck className="h-6 w-6 text-primary" />
                  </div>
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

      {/* Visual Concerns Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Common Concerns Addressed
          </h2>
          <p className="text-center text-muted-foreground mb-12 max-w-3xl mx-auto">
            We understand that trying a new tool can be intimidating. Here's how we address common concerns:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {concerns.map((concern, index) => (
              <div key={concern.title} className="bg-accent/5 rounded-lg p-6">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-xl mb-4">{concern.title}</h3>
                <p className="text-muted-foreground">{concern.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced FAQ Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-accent/5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {faq.map((item) => (
              <div key={item.question} className="bg-background rounded-lg shadow-sm p-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-xl mb-2">{item.question}</h3>
                    <p className="text-muted-foreground">{item.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Validate Your Business Idea?
          </h2>
          <div className="flex justify-center gap-8 mb-8">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-primary" />
              <span className="text-muted-foreground">12 Free Generations</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-primary" />
              <span className="text-muted-foreground">No Credit Card</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-primary" />
              <span className="text-muted-foreground">Instant Access</span>
            </div>
          </div>
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
