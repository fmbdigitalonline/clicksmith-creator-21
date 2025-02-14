
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeroSectionProps {
  content: {
    title: string;
    description: string;
    cta: string;
  };
  layout: string;
  className?: string;
}

const HeroSection = ({ content, layout, className }: HeroSectionProps) => {
  return (
    <section className={cn("py-16 md:py-24", className)}>
      <div className="container mx-auto px-4">
        <div className={cn(
          "grid gap-8",
          layout === "split" ? "md:grid-cols-2" : "text-center"
        )}>
          <div className="space-y-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold">
              {content.title}
            </h1>
            <p className="text-xl text-gray-600">
              {content.description}
            </p>
            <Button size="lg" className="bg-facebook hover:bg-facebook/90">
              {content.cta}
            </Button>
          </div>
          {layout === "split" && (
            <div className="relative">
              <div className="aspect-video rounded-lg bg-gradient-to-br from-facebook/10 to-facebook/5" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
