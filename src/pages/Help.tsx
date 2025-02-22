
import Navigation from "@/components/Navigation";
import IndexFooter from "@/components/IndexFooter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

const Help = () => {
  const categories = [
    {
      title: "Getting Started",
      items: [
        {
          question: "How do I create my first project?",
          answer: "Navigate to the dashboard, click on 'New Project', and follow the step-by-step wizard to set up your project."
        },
        {
          question: "What are credits and how do they work?",
          answer: "Credits are used to generate AI-powered content. Each new account receives 12 free credits, and you can purchase more as needed."
        }
      ]
    },
    {
      title: "Account Management",
      items: [
        {
          question: "How do I update my account information?",
          answer: "Go to Settings in your dashboard to update your profile, notification preferences, and subscription details."
        },
        {
          question: "Can I change my subscription plan?",
          answer: "Yes, you can upgrade or downgrade your subscription plan at any time from the Settings page."
        }
      ]
    },
    {
      title: "Billing",
      items: [
        {
          question: "How do I view my billing history?",
          answer: "Access your billing history in the Settings page under the Billing section."
        },
        {
          question: "What payment methods do you accept?",
          answer: "We accept all major credit cards and debit cards."
        }
      ]
    }
  ];

  return (
    <div className="flex flex-col w-full min-h-screen">
      <Navigation />
      <main className="flex-grow mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4">Help Center</h1>
              <p className="text-xl text-muted-foreground mb-8">
                Find answers to common questions and learn how to use our platform
              </p>
              <div className="flex gap-2 max-w-md mx-auto">
                <Input placeholder="Search help articles..." />
                <Button>
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>
            </div>

            <div className="space-y-8">
              {categories.map((category, index) => (
                <div key={index}>
                  <h2 className="text-2xl font-semibold mb-4">{category.title}</h2>
                  <Accordion type="single" collapsible className="w-full">
                    {category.items.map((item, itemIndex) => (
                      <AccordionItem key={itemIndex} value={`item-${index}-${itemIndex}`}>
                        <AccordionTrigger>{item.question}</AccordionTrigger>
                        <AccordionContent>
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <IndexFooter />
    </div>
  );
};

export default Help;
