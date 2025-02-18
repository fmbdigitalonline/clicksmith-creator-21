
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CtaSectionProps {
  content?: {
    title?: string;
    description?: string;
    buttonText?: string;
  };
  className?: string;
  layout?: string;
}

const CtaSection = ({ content, className, layout = "centered" }: CtaSectionProps) => {
  const title = content?.title || "Ready to Get Started?";
  const description = content?.description || "Join us today and transform your business";
  const buttonText = content?.buttonText || "Get Started";

  return (
    <section className={cn("py-16 bg-background", className)}>
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          <p className="text-muted-foreground mb-8">{description}</p>
          <Button size="lg">{buttonText}</Button>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
