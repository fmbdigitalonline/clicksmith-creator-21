
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Navigation from "@/components/Navigation";
import IndexFooter from "@/components/IndexFooter";

const FAQ = () => {
  const faqs = [
    {
      question: "What is Viable?",
      answer: "Viable is an AI-powered platform that helps entrepreneurs and businesses validate their ideas before investing significant time and resources. Our tools use advanced analytics and market data to test concept viability and provide actionable insights."
    },
    {
      question: "How does the platform work?",
      answer: "Our platform uses AI to analyze your business idea across multiple dimensions. You input your concept, and we generate detailed market analysis, potential customer profiles, and viability scores. We also provide customized recommendations for improving your idea's chances of success."
    },
    {
      question: "What kind of businesses can use Viable?",
      answer: "Viable is designed for a wide range of businesses, from startups to established companies. Whether you're launching a new product, entering a new market, or pivoting your business model, our platform can help validate your decisions."
    },
    {
      question: "How accurate are the results?",
      answer: "Our AI models are trained on extensive market data and real business outcomes. While no prediction is 100% certain, our platform provides evidence-based insights that significantly improve decision-making compared to gut instinct alone."
    },
    {
      question: "What's included in the free trial?",
      answer: "The free trial includes access to our basic idea validation tools, including market analysis and customer profile generation. Premium features like detailed competitor analysis and custom reports are available in paid plans."
    },
    {
      question: "How do I get started?",
      answer: "Getting started is easy! Simply sign up for a free account, describe your business idea, and our AI will begin analyzing its viability. The entire process takes just a few minutes to complete."
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 mt-16">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold tracking-tight mb-4">Frequently Asked Questions</h1>
              <p className="text-xl text-muted-foreground">
                Find answers to common questions about our platform and services.
              </p>
            </div>

            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent>
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>

            <div className="mt-12 text-center">
              <p className="text-muted-foreground">
                Still have questions? Feel free to{" "}
                <a href="/contact" className="text-primary hover:underline">
                  contact us
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </main>

      <IndexFooter />
    </div>
  );
};

export default FAQ;
