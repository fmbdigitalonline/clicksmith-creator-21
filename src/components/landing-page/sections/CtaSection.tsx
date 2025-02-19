
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
    <section className={cn(
      "py-24 bg-gradient-to-r from-primary/10 to-accent/10",
      className
    )}>
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">{title}</h2>
          <p className="text-xl text-gray-600 mb-12">{description}</p>
          <Button 
            size="lg"
            className="bg-primary hover:bg-primary/90 text-white px-12 py-6 text-lg"
          >
            {buttonText}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
