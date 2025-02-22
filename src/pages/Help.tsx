
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Navigation from "@/components/Navigation";
import IndexFooter from "@/components/IndexFooter";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const Help = () => {
  const helpCategories = [
    {
      title: "Getting Started",
      items: [
        {
          question: "How do I create an account?",
          answer: "Click the 'Sign Up' button in the top right corner and follow the registration process. You'll receive 12 free credits upon registration to try out our services."
        },
        {
          question: "What can I do with my free credits?",
          answer: "Free credits can be used to validate business ideas, generate market analysis reports, and test different aspects of your business concept."
        }
      ]
    },
    {
      title: "Using the Platform",
      items: [
        {
          question: "How does the validation process work?",
          answer: "Enter your business idea details into our platform, and our AI will analyze market potential, target audience, and competition to provide comprehensive validation insights."
        },
        {
          question: "How long does the analysis take?",
          answer: "Most analyses are completed within minutes, though more complex validations might take up to 24 hours for thorough results."
        }
      ]
    },
    {
      title: "Account & Billing",
      items: [
        {
          question: "How do I purchase more credits?",
          answer: "Visit the pricing page to view our credit packages and subscription options. You can purchase credits directly through our secure payment system."
        },
        {
          question: "Can I get a refund?",
          answer: "We offer refunds within 30 days of purchase if you're not satisfied with our services. Contact our support team for assistance."
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 mt-16">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold tracking-tight mb-4">Help Center</h1>
              <p className="text-xl text-muted-foreground mb-8">
                Find answers and learn how to get the most out of Viable
              </p>
              
              <div className="relative max-w-xl mx-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search help articles..."
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-8">
              {helpCategories.map((category, index) => (
                <section key={index}>
                  <h2 className="text-2xl font-semibold mb-4">{category.title}</h2>
                  <Accordion type="single" collapsible className="w-full">
                    {category.items.map((item, itemIndex) => (
                      <AccordionItem key={itemIndex} value={`${index}-${itemIndex}`}>
                        <AccordionTrigger className="text-left">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent>
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>
              ))}
            </div>

            <div className="mt-12 text-center">
              <p className="text-muted-foreground mb-4">
                Can't find what you're looking for?
              </p>
              <Button asChild>
                <a href="/contact">Contact Support</a>
              </Button>
            </div>
          </div>
        </div>
      </main>

      <IndexFooter />
    </div>
  );
};

export default Help;
