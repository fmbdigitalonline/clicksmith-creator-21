
import Navigation from "@/components/Navigation";
import IndexFooter from "@/components/IndexFooter";
import { Building, Users, HandShake, BookOpen } from "lucide-react";

const About = () => {
  return (
    <div className="flex flex-col w-full min-h-screen">
      <Navigation />
      <main className="flex-grow mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-8 text-center">About Us</h1>
            
            <div className="grid md:grid-cols-2 gap-8 mb-16">
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Our Mission</h2>
                <p className="text-muted-foreground">
                  We empower businesses to thrive in the digital age by providing cutting-edge AI-powered 
                  solutions for business validation and marketing strategy development. Our platform helps 
                  entrepreneurs and businesses make data-driven decisions with confidence.
                </p>
              </div>
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Our Vision</h2>
                <p className="text-muted-foreground">
                  To revolutionize how businesses approach market validation and strategy development, 
                  making sophisticated AI tools accessible to entrepreneurs of all sizes.
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card hover:shadow-lg transition-shadow">
                <Building className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Established</h3>
                <p className="text-muted-foreground">Founded in 2023 with a vision for innovation</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card hover:shadow-lg transition-shadow">
                <Users className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Our Team</h3>
                <p className="text-muted-foreground">Diverse experts in AI, marketing, and business</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card hover:shadow-lg transition-shadow">
                <HandShake className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Partners</h3>
                <p className="text-muted-foreground">Trusted by leading businesses worldwide</p>
              </div>
              <div className="flex flex-col items-center text-center p-6 rounded-lg bg-card hover:shadow-lg transition-shadow">
                <BookOpen className="w-12 h-12 text-primary mb-4" />
                <h3 className="text-xl font-semibold mb-2">Knowledge</h3>
                <p className="text-muted-foreground">Continuous learning and innovation</p>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Our Values</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="text-xl font-medium">Innovation</h3>
                  <p className="text-muted-foreground">
                    We continuously push boundaries to deliver cutting-edge solutions.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-medium">Transparency</h3>
                  <p className="text-muted-foreground">
                    We believe in open communication and honest relationships.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-medium">Excellence</h3>
                  <p className="text-muted-foreground">
                    We strive for excellence in everything we do.
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-medium">Customer Success</h3>
                  <p className="text-muted-foreground">
                    Your success is our success. We're committed to helping you grow.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <IndexFooter />
    </div>
  );
};

export default About;
