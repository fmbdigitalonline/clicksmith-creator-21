import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Target, 
  Rocket, 
  DollarSign, 
  Clock, 
  ChartBar, 
  Lightbulb,
  Check,
  ArrowRight,
  MessageSquare,
  User,
  Star
} from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 animate-fade-in">
            Ready to validate your business idea?
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 animate-fade-in delay-100">
            Stop guessing. Start knowing. Test your concept with real audiences before investing time and money.
          </p>
          <Button 
            onClick={() => navigate("/ad-wizard/new")}
            size="lg"
            className="bg-facebook hover:bg-facebook/90 text-white text-lg px-8 py-6 h-auto animate-fade-in delay-200"
          >
            Validate Your Idea Now
          </Button>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                How It Works
              </h2>
              <p className="text-xl text-gray-600">
                Three simple steps to validate your business idea
              </p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-3">
              <StepCard
                icon={<Lightbulb className="w-8 h-8 text-facebook" />}
                step="1"
                title="Share Your Idea"
                description="Start with your concept or product proposition. We'll help you refine it for testing."
              />
              <StepCard
                icon={<Target className="w-8 h-8 text-facebook" />}
                step="2"
                title="Get Audience Insights"
                description="We'll help you identify your ideal customers and craft messaging that resonates."
              />
              <StepCard
                icon={<ChartBar className="w-8 h-8 text-facebook" />}
                step="3"
                title="Generate & Test Ads"
                description="Get ready-to-use ads for multiple platforms and start collecting real market data."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="bg-gray-50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                What Founders Say
              </h2>
              <p className="text-xl text-gray-600">
                Join entrepreneurs who are building products people actually want
              </p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-2">
              <TestimonialCard
                quote="This platform saved us months of development time by helping us validate our idea before building."
                author="Sarah Chen"
                role="Founder, TechStart"
                rating={5}
              />
              <TestimonialCard
                quote="The audience insights helped us pivot our messaging and find our perfect market fit."
                author="Michael Rodriguez"
                role="CEO, MarketFit"
                rating={5}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-12">
            <div className="text-center space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Why Choose Our Platform
              </h2>
              <p className="text-xl text-gray-600">
                Everything you need to validate your business idea
              </p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-3">
              <FeatureCard
                icon={<Clock className="w-6 h-6 text-facebook" />}
                title="Save Time"
                description="Get validation results in days, not months"
              />
              <FeatureCard
                icon={<DollarSign className="w-6 h-6 text-facebook" />}
                title="Reduce Risk"
                description="Test before investing heavily in development"
              />
              <FeatureCard
                icon={<Rocket className="w-6 h-6 text-facebook" />}
                title="Launch Confidently"
                description="Move forward with data-backed decisions"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="bg-gray-50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Ready to validate your idea?
            </h2>
            <p className="text-xl text-gray-600">
              Join entrepreneurs who are building products people actually want
            </p>
            <Button
              onClick={() => navigate("/ad-wizard/new")}
              size="lg"
              className="bg-facebook hover:bg-facebook/90 text-white text-lg px-8 py-6 h-auto"
            >
              Start Validating Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StepCard = ({ icon, step, title, description }: { 
  icon: React.ReactNode;
  step: string;
  title: string;
  description: string;
}) => (
  <div className="relative p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <div className="inline-block p-2 bg-gray-50 rounded-lg">
          {icon}
        </div>
        <div className="h-8 w-8 flex items-center justify-center bg-facebook text-white rounded-full font-semibold">
          {step}
        </div>
      </div>
      <h3 className="text-xl font-semibold text-gray-900">
        {title}
      </h3>
      <p className="text-gray-600">
        {description}
      </p>
    </div>
    <ArrowRight className="absolute right-4 bottom-4 w-5 h-5 text-facebook opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
  </div>
);

const TestimonialCard = ({ quote, author, role, rating }: {
  quote: string;
  author: string;
  role: string;
  rating: number;
}) => (
  <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
    <div className="space-y-4">
      <div className="flex space-x-1">
        {[...Array(rating)].map((_, i) => (
          <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
        ))}
      </div>
      <div className="flex space-x-2 items-start">
        <MessageSquare className="w-5 h-5 text-facebook mt-1" />
        <p className="text-gray-600 italic">"{quote}"</p>
      </div>
      <div className="flex items-center space-x-3">
        <User className="w-5 h-5 text-gray-400" />
        <div>
          <p className="font-semibold text-gray-900">{author}</p>
          <p className="text-sm text-gray-600">{role}</p>
        </div>
      </div>
    </div>
  </div>
);

const FeatureCard = ({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
    <div className="space-y-4">
      <div className="inline-block p-2 bg-gray-50 rounded-lg">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900">
        {title}
      </h3>
      <p className="text-gray-600">
        {description}
      </p>
    </div>
  </div>
);

export default Landing;