import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, Target, Zap, LineChart, Shield, Rocket } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      {/* Hero Section */}
      <header className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent animate-fade-in">
          Validate Your Business Idea with Confidence
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto animate-fade-in">
          Test your business concept against real audiences before investing time and resources. Get data-driven insights to make informed decisions.
        </p>
        <div className="flex gap-4 justify-center animate-fade-in">
          <Link to="/login">
            <Button size="lg" className="gap-2">
              Start Validating <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
          <Link to="/pricing">
            <Button size="lg" variant="outline">
              View Pricing
            </Button>
          </Link>
        </div>
      </header>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={Target}
            title="Early Market Validation"
            description="Test your ideas against real audiences before investing significant resources. Get immediate feedback on what works."
          />
          <FeatureCard
            icon={CheckCircle2}
            title="Target Audience Clarity"
            description="Define your ideal customer profile with precision. Make data-driven decisions about your market positioning."
          />
          <FeatureCard
            icon={Zap}
            title="Efficient Testing"
            description="Launch micro-campaigns on Google, Facebook, and TikTok to quickly gauge market interest and refine your approach."
          />
          <FeatureCard
            icon={LineChart}
            title="Actionable Insights"
            description="Get measurable feedback from real marketing campaigns to guide your product development and marketing strategy."
          />
          <FeatureCard
            icon={Shield}
            title="Reduced Risk"
            description="Minimize financial and operational risks by validating interest before full product development."
          />
          <FeatureCard
            icon={Rocket}
            title="Faster Time-to-Market"
            description="Move forward confidently with clear feedback and insights, bringing your offering to market efficiently."
          />
        </div>
      </section>

      {/* Call to Action */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="bg-gradient-glass rounded-lg p-8 shadow-lg max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">Ready to Validate Your Idea?</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Don't rely on guesswork. Get the tools and insights you need to make informed decisions about your business idea.
          </p>
          <Link to="/login">
            <Button size="lg" className="gap-2">
              Start Now <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, description }: { icon: any; title: string; description: string }) => {
  return (
    <div className="p-6 rounded-lg bg-gradient-glass shadow-lg hover:shadow-xl transition-shadow animate-fade-in">
      <Icon className="h-12 w-12 text-primary mb-4" />
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};

export default Landing;