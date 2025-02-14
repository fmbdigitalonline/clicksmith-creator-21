
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CtaSectionProps {
  content: {
    title: string;
    description: string;
    buttonText: string;
  };
  className?: string;
}

const CtaSection = ({ content, className }: CtaSectionProps) => {
  return (
    <section className={cn("py-16 bg-primary text-primary-foreground", className)}>
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">{content.title}</h2>
          <p className="mb-8 text-primary-foreground/90">{content.description}</p>
          <Button size="lg" variant="secondary">
            {content.buttonText}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
