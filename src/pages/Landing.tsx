import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { 
  Target, 
  Rocket, 
  DollarSign, 
  Clock, 
  ChartBar, 
  Lightbulb,
  Check
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

      {/* Questions Section */}
      <div className="bg-white py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-16">
            <div className="grid gap-8 md:grid-cols-2">
              {/* Question Cards */}
              <QuestionCard
                icon={<Target className="w-8 h-8 text-facebook" />}
                question="Who will actually buy your product?"
                answer="Stop guessing about your target market. Get data-driven insights about your ideal customers and what makes them tick."
              />
              <QuestionCard
                icon={<DollarSign className="w-8 h-8 text-facebook" />}
                question="Are you building something people will pay for?"
                answer="Test market demand before investing heavily in development. Save time and money by validating first."
              />
              <QuestionCard
                icon={<Clock className="w-8 h-8 text-facebook" />}
                question="How long until you know if your idea works?"
                answer="Get real market feedback in days, not months. Quick iterations mean faster path to product-market fit."
              />
              <QuestionCard
                icon={<ChartBar className="w-8 h-8 text-facebook" />}
                question="What messaging resonates with your audience?"
                answer="Discover exactly what hooks and value propositions capture your audience's attention through real-world testing."
              />
            </div>

            {/* Benefits Section */}
            <div className="space-y-8 text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
                Why Validate First?
              </h2>
              <div className="grid gap-6 md:grid-cols-3">
                <BenefitCard
                  icon={<Lightbulb className="w-6 h-6 text-facebook" />}
                  title="Test Fast"
                  description="Launch micro-campaigns across multiple platforms in minutes"
                />
                <BenefitCard
                  icon={<Rocket className="w-6 h-6 text-facebook" />}
                  title="Learn Quick"
                  description="Get actionable insights about what resonates with your audience"
                />
                <BenefitCard
                  icon={<Check className="w-6 h-6 text-facebook" />}
                  title="Build Smart"
                  description="Move forward with confidence, backed by real market data"
                />
              </div>
            </div>

            {/* Final CTA */}
            <div className="text-center space-y-6 bg-gray-50 p-8 rounded-2xl">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                Ready to validate your business idea?
              </h2>
              <p className="text-gray-600">
                Join entrepreneurs who are building products people actually want.
              </p>
              <Button
                onClick={() => navigate("/ad-wizard/new")}
                size="lg"
                className="bg-facebook hover:bg-facebook/90 text-white"
              >
                Start Validating Now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const QuestionCard = ({ 
  icon, 
  question, 
  answer 
}: { 
  icon: React.ReactNode;
  question: string;
  answer: string;
}) => (
  <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
    <div className="space-y-4">
      <div className="inline-block p-2 bg-gray-50 rounded-lg">
        {icon}
      </div>
      <h3 className="text-xl font-semibold text-gray-900">
        {question}
      </h3>
      <p className="text-gray-600">
        {answer}
      </p>
    </div>
  </div>
);

const BenefitCard = ({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="space-y-2">
    <div className="inline-block p-2 bg-gray-50 rounded-lg">
      {icon}
    </div>
    <h3 className="font-semibold text-gray-900">
      {title}
    </h3>
    <p className="text-gray-600 text-sm">
      {description}
    </p>
  </div>
);

export default Landing;