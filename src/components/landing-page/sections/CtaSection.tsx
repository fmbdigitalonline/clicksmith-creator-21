
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CtaSectionProps {
  content?: {
    title?: string;
    description?: string;
    buttonText?: string;
  };
  className?: string;
}

const CtaSection = ({ content = {}, className }: CtaSectionProps) => {
  const defaultContent = {
    title: "Ready to Get Started?",
    description: "Join us today and experience the difference.",
    buttonText: "Get Started"
  };

  const title = content?.title || defaultContent.title;
  const description = content?.description || defaultContent.description;
  const buttonText = content?.buttonText || defaultContent.buttonText;

  return (
    <section className={cn("py-16 bg-background border-t border-gray-100", className)}>
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-4">{title}</h2>
          <p className="mb-8 text-muted-foreground">{description}</p>
          <Button size="lg">
            {buttonText}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
