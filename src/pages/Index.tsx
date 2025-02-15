import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle, MessageCircle, BadgeCheck, Target, ArrowRight as ArrowRightIcon, Lightbulb, PieChart, DollarSign, Users, BarChart, Globe, Rocket } from "lucide-react";
import { TextCycler } from "@/components/TextCycler";
import LandingNav from "@/components/LandingNav";

const Index = () => {
  const features = [
    {
      title: "AI-Powered Analysis",
      description: "Get instant insights into your market potential and target audience.",
      icon: <PieChart className="h-6 w-6 text-primary" />,
    },
    {
      title: "Smart Suggestions",
      description: "Receive personalized recommendations to improve your success rate.",
      icon: <Lightbulb className="h-6 w-6 text-primary" />,
    },
    {
      title: "Market Validation",
      description: "Validate your idea with real market data and customer insights.",
      icon: <BarChart className="h-6 w-6 text-primary" />,
    },
    {
      title: "Audience Analysis",
      description: "Understand your target audience's needs and preferences.",
      icon: <Users className="h-6 w-6 text-primary" />,
    },
    {
      title: "ROI Forecasting",
      description: "Project potential returns and business viability.",
      icon: <DollarSign className="h-6 w-6 text-primary" />,
    },
  ];

  const adFeatures = [
    {
      title: "AI-Generated Creatives",
      description: "Create stunning visuals and copy with AI assistance.",
      icon: <CheckCircle className="h-6 w-6 text-primary" />,
    },
    {
      title: "Multi-Platform Support",
      description: "Generate ads for Facebook, Instagram, Google, and more.",
      icon: <BadgeCheck className="h-6 w-6 text-primary" />,
    },
    {
      title: "Smart Optimization",
      description: "Get AI-powered suggestions to improve ad performance.",
      icon: <MessageCircle className="h-6 w-6 text-primary" />,
    },
  ];

  const landingPageFeatures = [
    {
      title: "Instant Generation",
      description: "Create a complete landing page in seconds with AI assistance.",
      icon: <Rocket className="h-6 w-6 text-primary" />,
    },
    {
      title: "Conversion Optimized",
      description: "Built-in best practices for maximum conversion rates.",
      icon: <ArrowRight className="h-6 w-6 text-primary" />,
    },
    {
      title: "Global Reach",
      description: "Multi-language support and international optimization.",
      icon: <Globe className="h-6 w-6 text-primary" />,
    },
  ];

  return (
    <div className="min-h-screen">
      <LandingNav />
      {/* Hero Section */}
      <section className="relative pt-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Target className="h-12 w-12 text-primary animate-pulse" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-8">
            Know If Your{' '}
            <span className="text-primary">
              <TextCycler
                items={['Idea', 'Product', 'Service', 'Marketing', 'Course']}
                interval={2000}
                className="inline-block"
              />
            </span>{' '}
            Will Succeed Before You Invest
          </h1>
          <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto">
            Use AI-powered market analysis to validate your business idea, understand your target audience,
            and get actionable insights before investing time and money.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-20">
            <Button size="lg" asChild>
              <Link to="/login">
                Get Started Free
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

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything You Need to Validate Your Idea
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our comprehensive suite of tools helps you make data-driven decisions
              about your business idea.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Create Ads Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Create Stunning Ads in Minutes
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Generate high-converting ad creatives for multiple platforms with our AI-powered tools.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {adFeatures.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* One Click Landing Page Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              One Click Landing Page
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Transform your business idea into a professional landing page instantly with AI-powered content generation.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {landingPageFeatures.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Index;
