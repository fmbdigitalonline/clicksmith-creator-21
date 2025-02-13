
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LandingPageContentProps {
  project: any;
  landingPage: any;
}

const LandingPageContent = ({ project, landingPage }: LandingPageContentProps) => {
  const [activeView, setActiveView] = useState<"edit" | "preview">("preview");
  const content = landingPage?.content || generateInitialContent(project);

  return (
    <div className="space-y-8">
      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as "edit" | "preview")}>
        <TabsList>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="edit">Edit</TabsTrigger>
        </TabsList>
        <TabsContent value="preview" className="mt-6">
          <PreviewMode content={content} />
        </TabsContent>
        <TabsContent value="edit" className="mt-6">
          <EditMode content={content} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const PreviewMode = ({ content }: { content: any }) => {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-16 px-4 bg-gradient-to-r from-purple-100 to-purple-50 rounded-lg">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">{content.hero.title}</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">{content.hero.description}</p>
        <Button size="lg">{content.hero.cta}</Button>
      </section>

      {/* Features Section */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-8">Key Features</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {content.features.map((feature: string, index: number) => (
            <Card key={index} className="p-6">
              <p className="text-gray-600">{feature}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 bg-gray-50 rounded-lg">
        <h2 className="text-3xl font-bold text-center mb-8">Benefits</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto px-4">
          {content.benefits.map((benefit: string, index: number) => (
            <div key={index} className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-purple-500 mt-2" />
              <p className="flex-1 text-gray-600">{benefit}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-12">
        <h2 className="text-3xl font-bold text-center mb-8">We Solve Your Challenges</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto px-4">
          {content.painPoints.map((point: string, index: number) => (
            <Card key={index} className="p-6">
              <p className="text-gray-600">{point}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 bg-gray-50 rounded-lg">
        <h2 className="text-3xl font-bold text-center mb-8">What Our Customers Say</h2>
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto px-4">
          {content.testimonials.map((testimonial: any, index: number) => (
            <Card key={index} className="p-6">
              <p className="text-gray-600 mb-4">{testimonial.content}</p>
              <div className="font-medium">
                <p className="text-gray-900">{testimonial.name}</p>
                <p className="text-gray-500">{testimonial.role}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="text-center py-16 px-4 bg-gradient-to-r from-purple-100 to-purple-50 rounded-lg">
        <h2 className="text-3xl font-bold mb-4">{content.callToAction.title}</h2>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
          {content.callToAction.description}
        </p>
        <Button size="lg">{content.callToAction.buttonText}</Button>
      </section>
    </div>
  );
};

const EditMode = ({ content }: { content: any }) => {
  // For now, we'll just show the JSON content
  // In a future iteration, we can add proper editing capabilities
  return (
    <pre className="p-4 bg-gray-50 rounded-lg overflow-auto">
      {JSON.stringify(content, null, 2)}
    </pre>
  );
};

const generateInitialContent = (project: any) => {
  const { business_idea, target_audience, audience_analysis } = project;
  
  return {
    hero: {
      title: business_idea?.valueProposition || project.title,
      description: business_idea?.description || "",
      cta: "Get Started Now",
    },
    features: audience_analysis?.keyFeatures || [],
    benefits: audience_analysis?.benefits || [],
    painPoints: target_audience?.painPoints || [],
    testimonials: [],
    callToAction: {
      title: "Ready to Get Started?",
      description: "Join thousands of satisfied customers and transform your business today.",
      buttonText: "Start Now",
    },
  };
};

export default LandingPageContent;
