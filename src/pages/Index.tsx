import { Link } from "react-router-dom";
import LandingNav from "@/components/LandingNav";
import IndexFooter from "@/components/IndexFooter";
import { Button } from "@/components/ui/button";
import TextCycler from "@/components/TextCycler";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingNav />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative z-10">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                  Validate Your Business Ideas
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  Use AI to identify your target audience and create engaging ads to test market demand. Save time and resources while maximizing your chances of success.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-white"
                    asChild
                  >
                    <Link to="/login">Get Started</Link>
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="bg-white"
                    asChild
                  >
                    <Link to="/about">Learn More</Link>
                  </Button>
                </div>
              </div>
              <div className="relative lg:h-[600px] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="/lovable-uploads/5fca500b-3385-470b-9c9c-bdfd3fa3d120.png"
                  alt="Professional using Viable platform"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-600/10 mix-blend-overlay"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Key Features</h2>
              <p className="text-gray-600 leading-relaxed mb-8">
                Viable is packed with features designed to help you validate your business ideas quickly and efficiently.
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-6 rounded-lg bg-white shadow-md">
                  <h3 className="font-semibold mb-2">AI-Powered Audience Identification</h3>
                  <p className="text-gray-600">Identify your ideal customer base using advanced AI algorithms.</p>
                </div>
                <div className="p-6 rounded-lg bg-white shadow-md">
                  <h3 className="font-semibold mb-2">Bulk Ad Creation</h3>
                  <p className="text-gray-600">Generate multiple ad variations quickly to test different marketing messages.</p>
                </div>
                <div className="p-6 rounded-lg bg-white shadow-md">
                  <h3 className="font-semibold mb-2">Market Testing</h3>
                  <p className="text-gray-600">Test your ads with real users and gather valuable feedback to refine your strategy.</p>
                </div>
                <div className="p-6 rounded-lg bg-white shadow-md">
                  <h3 className="font-semibold mb-2">User-Friendly Interface</h3>
                  <p className="text-gray-600">Enjoy a seamless experience with our intuitive and easy-to-navigate platform.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">What Our Users Say</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-6 rounded-lg bg-gray-50">
                  <p className="text-gray-600 mb-4">"Viable has transformed the way I validate my business ideas. The AI-generated audience insights are incredibly accurate, and the platform makes it easy to create and test multiple ads."</p>
                  <div className="font-semibold">John Doe</div>
                  <div className="text-gray-500 text-sm">Entrepreneur</div>
                </div>
                <div className="p-6 rounded-lg bg-gray-50">
                  <p className="text-gray-600 mb-4">"The bulk ad creation feature is a game-changer. I was able to generate a large number of ads quickly and see which ones performed best. This has been invaluable in testing market demand."</p>
                  <div className="font-semibold">Jane Smith</div>
                  <div className="text-gray-500 text-sm">Small Business Owner</div>
                </div>
                <div className="p-6 rounded-lg bg-gray-50">
                  <p className="text-gray-600 mb-4">"With Viable, I was able to launch my business idea much faster than I thought possible. The platform is a true game changer for anyone looking to validate their concept."</p>
                  <div className="font-semibold">Mike Johnson</div>
                  <div className="text-gray-500 text-sm">Startup Founder</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="py-24 bg-gradient-to-r from-primary to-purple-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-8">Ready to Validate Your Idea?</h2>
            <p className="text-xl leading-relaxed mb-12">
              Join Viable today and start testing your business ideas with confidence. Our AI-powered platform makes it easy to identify your target audience, create compelling ads, and gather valuable feedback.
            </p>
            <Button size="lg" className="bg-white text-primary hover:bg-gray-100">
              Get Started Now
            </Button>
          </div>
        </section>
      </main>
      <IndexFooter />
    </div>
  );
};

export default Index;
