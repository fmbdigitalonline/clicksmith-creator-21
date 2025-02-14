
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeroSectionProps {
  content: {
    title: string;
    description: string;
    cta: string;
    image?: string; // Add image support
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
          {layout === "split" && content.image && (
            <div className="relative order-2 md:order-1">
              <img 
                src={content.image}
                alt="Hero visual"
                className="rounded-lg w-full h-full object-cover aspect-[4/3] shadow-lg"
              />
            </div>
          )}
          <div className={cn(
            "space-y-6",
            layout === "split" ? "order-1 md:order-2" : "mx-auto max-w-2xl"
          )}>
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
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
