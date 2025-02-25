
import LandingNav from "@/components/LandingNav";
import IndexFooter from "@/components/IndexFooter";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

const About = () => {
  const features = [
    "AI-Powered Audience Identification",
    "Bulk Ad Creation",
    "Market Testing",
    "User-Friendly Interface",
    "Responsive and SEO-Friendly Ads",
    "Data-Driven Insights"
  ];

  const testimonials = [
    {
      quote: "Viable has transformed the way I validate my business ideas. The AI-generated audience insights are incredibly accurate, and the platform makes it easy to create and test multiple ads.",
      author: "John Doe",
      role: "Entrepreneur"
    },
    {
      quote: "The bulk ad creation feature is a game-changer. I was able to generate a large number of ads quickly and see which ones performed best. This has been invaluable in testing market demand.",
      author: "Jane Smith",
      role: "Small Business Owner"
    },
    {
      quote: "With Viable, I was able to launch my business idea much faster than I thought possible. The platform is a true game changer for anyone looking to validate their concept.",
      author: "Mike Johnson",
      role: "Startup Founder"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <LandingNav />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-white to-gray-50 py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600">
                Welcome to Viable
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                At Viable, we believe that validating and prototyping business ideas should be accessible to everyone, regardless of technical expertise. Our mission is to simplify the process of identifying your target audience and creating compelling ads, enabling you to understand your audience better and test their willingness to pay for your idea.
              </p>
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">Our Vision</h2>
              <p className="text-gray-600 leading-relaxed">
                Imagine a world where the gap between innovative ideas and successful businesses is bridged by powerful yet user-friendly tools. Viable is dedicated to democratizing the process of audience validation and ad creation, making it easy for anyone to turn their vision into reality in just a few clicks.
              </p>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <p className="text-gray-600 leading-relaxed">
                Viable was founded by a team of passionate entrepreneurs and technologists who recognized the challenges faced by startups and small businesses in validating their ideas. Traditional methods of audience research and ad creation often require specialized skills in market research, copywriting, and design, which can be time-consuming and expensive. We aimed to solve this problem by leveraging the power of AI to automate and streamline the process.
              </p>
            </div>
          </div>
        </section>

        {/* How We Help Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">How We Help</h2>
              <p className="text-gray-600 leading-relaxed mb-8">
                Using advanced AI tools like ChatGPT and Midjourney, Viable provides a seamless and efficient way to identify your target audience and create bulk ads with resonating marketing messaging. Our platform, built on a robust framework, allows users to:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <p className="text-gray-600">Identify Target Audiences: Quickly understand your customer base and tailor your messaging accordingly.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <p className="text-gray-600">Create Compelling Ads: Generate high-quality ads that resonate with your target audience.</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <p className="text-gray-600">Test Market Demand: Understand how your target audience perceives your idea and whether they are willing to pay for it.</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <p className="text-gray-600">Optimize for Conversion: Ensure your ads are designed to drive conversions and gather valuable insights.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8">Key Features</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {features.map((feature, index) => (
                  <Card key={index} className="bg-white">
                    <CardContent className="pt-6">
                      <h3 className="font-semibold text-lg mb-2">{feature}</h3>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">Our Team</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-6 rounded-lg bg-gray-50">
                  <h3 className="font-semibold mb-2">Product Experts</h3>
                  <p className="text-gray-600">Developers and designers with a deep understanding of user needs and industry trends.</p>
                </div>
                <div className="p-6 rounded-lg bg-gray-50">
                  <h3 className="font-semibold mb-2">AI Specialists</h3>
                  <p className="text-gray-600">Engineers specializing in AI-driven audience analysis and ad generation.</p>
                </div>
                <div className="p-6 rounded-lg bg-gray-50">
                  <h3 className="font-semibold mb-2">Customer Success</h3>
                  <p className="text-gray-600">Dedicated support to help you every step of the way.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8">Testimonials</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {testimonials.map((testimonial, index) => (
                  <Card key={index} className="bg-white">
                    <CardContent className="pt-6">
                      <p className="text-gray-600 mb-4">{testimonial.quote}</p>
                      <div className="font-semibold">{testimonial.author}</div>
                      <div className="text-gray-500 text-sm">{testimonial.role}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Join Us Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-6">Join Us</h2>
              <p className="text-gray-600 leading-relaxed mb-8">
                We're excited to help you bring your business ideas to life. Whether you're a startup founder, entrepreneur, or small business owner, Viable provides the tools and support you need to succeed. Sign up today and start validating your ideas with high-quality audience insights and engaging ads.
              </p>
            </div>
          </div>
        </section>
      </main>
      <IndexFooter />
    </div>
  );
};

export default About;
