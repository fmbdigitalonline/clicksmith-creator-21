
import Navigation from "@/components/Navigation";
import IndexFooter from "@/components/IndexFooter";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 mt-16">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold tracking-tight mb-4">About Viable</h1>
              <p className="text-xl text-muted-foreground">
                Empowering entrepreneurs with AI-driven business validation
              </p>
            </div>

            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-semibold mb-4">Our Mission</h2>
                <p className="text-muted-foreground">
                  At Viable, we're dedicated to helping entrepreneurs and businesses make data-driven decisions. 
                  Our AI-powered platform transforms the way ideas are validated, making business planning more 
                  efficient and successful.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">What We Do</h2>
                <p className="text-muted-foreground">
                  We combine advanced AI technology with market intelligence to provide comprehensive business 
                  idea validation. Our platform analyzes market potential, identifies target audiences, and 
                  delivers actionable insights to increase your chances of success.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4">Our Values</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 bg-card rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Innovation</h3>
                    <p className="text-muted-foreground">Continuously pushing the boundaries of AI technology to provide better insights</p>
                  </div>
                  <div className="p-6 bg-card rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Accuracy</h3>
                    <p className="text-muted-foreground">Delivering reliable, data-driven insights you can trust</p>
                  </div>
                  <div className="p-6 bg-card rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Empowerment</h3>
                    <p className="text-muted-foreground">Giving entrepreneurs the tools they need to succeed</p>
                  </div>
                  <div className="p-6 bg-card rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Accessibility</h3>
                    <p className="text-muted-foreground">Making professional-grade analysis available to businesses of all sizes</p>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      <IndexFooter />
    </div>
  );
};

export default About;
