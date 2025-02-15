
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface FaqSectionProps {
  content?: {
    subheadline?: string;
    questions?: Array<{
      question: string;
      answer: string;
    }>;
  };
  className?: string;
}

const FaqSection = ({ content, className }: FaqSectionProps) => {
  if (!content) return null;

  return (
    <section className={cn("py-16 bg-background border-t border-b border-gray-100", className)}>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-4">FAQ</h2>
        {content.subheadline && (
          <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            {content.subheadline}
          </p>
        )}

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible>
            {content.questions?.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>{item.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
