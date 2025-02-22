
import LandingNav from "@/components/LandingNav";
import IndexFooter from "@/components/IndexFooter";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingNav />
      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">About Viable</h1>
          
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
            <p className="text-gray-600 text-lg mb-6">
              At Viable, we're on a mission to revolutionize the way businesses create and optimize their marketing content through the power of AI technology.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">What We Do</h2>
            <p className="text-gray-600 text-lg mb-6">
              We provide cutting-edge AI-powered tools that help businesses generate effective marketing content, analyze audience engagement, and optimize their advertising strategies across multiple platforms.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Our Values</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-medium mb-2">Innovation</h3>
                <p className="text-gray-600">
                  We constantly push the boundaries of what's possible with AI and marketing technology.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">Quality</h3>
                <p className="text-gray-600">
                  We maintain the highest standards in our AI algorithms and content generation.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">User-Centric</h3>
                <p className="text-gray-600">
                  Everything we build is designed with our users' success in mind.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-medium mb-2">Reliability</h3>
                <p className="text-gray-600">
                  We provide consistent, dependable service that our clients can count on.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
      <IndexFooter />
    </div>
  );
};

export default About;
