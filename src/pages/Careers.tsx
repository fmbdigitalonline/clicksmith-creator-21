
import Navigation from "@/components/Navigation";
import IndexFooter from "@/components/IndexFooter";
import { Button } from "@/components/ui/button";

const Careers = () => {
  const openPositions = [
    {
      title: "Senior AI Engineer",
      department: "Engineering",
      location: "Remote",
      type: "Full-time",
      description: "Join our core team building the next generation of AI-powered business validation tools."
    },
    {
      title: "Product Manager",
      department: "Product",
      location: "Remote",
      type: "Full-time",
      description: "Lead product strategy and development for our growing platform."
    },
    {
      title: "Data Scientist",
      department: "Data",
      location: "Remote",
      type: "Full-time",
      description: "Help improve our AI models and develop new validation algorithms."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 mt-16">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold tracking-tight mb-4">Join Our Team</h1>
              <p className="text-xl text-muted-foreground">
                Help us empower entrepreneurs with AI-driven insights
              </p>
            </div>

            <section className="mb-16">
              <h2 className="text-2xl font-semibold mb-6">Why Work at Viable?</h2>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="p-6 bg-card rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Innovation First</h3>
                  <p className="text-muted-foreground">Work with cutting-edge AI technology and shape the future of business validation.</p>
                </div>
                <div className="p-6 bg-card rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Remote Culture</h3>
                  <p className="text-muted-foreground">Enjoy the flexibility of remote work with a global team of passionate individuals.</p>
                </div>
                <div className="p-6 bg-card rounded-lg">
                  <h3 className="text-lg font-semibold mb-2">Growth & Impact</h3>
                  <p className="text-muted-foreground">Make a real difference in helping entrepreneurs succeed while growing your career.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-6">Open Positions</h2>
              <div className="space-y-6">
                {openPositions.map((position, index) => (
                  <div key={index} className="p-6 bg-card rounded-lg">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">{position.title}</h3>
                        <p className="text-muted-foreground">{position.department} · {position.location} · {position.type}</p>
                      </div>
                      <Button>Apply Now</Button>
                    </div>
                    <p className="text-muted-foreground">{position.description}</p>
                  </div>
                ))}
              </div>
            </section>

            <div className="mt-12 text-center">
              <p className="text-muted-foreground mb-4">
                Don't see a position that matches your skills?
              </p>
              <Button variant="outline" asChild>
                <a href="/contact">Contact Us</a>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <IndexFooter />
    </div>
  );
};

export default Careers;
