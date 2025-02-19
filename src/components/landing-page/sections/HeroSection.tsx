
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HeroSectionProps {
  content: {
    title: string;
    description: string;
    cta: string;
    image?: string;
  };
  layout: string;
  className?: string;
}

const HeroSection = ({ content, layout, className }: HeroSectionProps) => {
  return (
    <section className={cn(
      "relative min-h-[80vh] flex items-center py-20",
      className
    )}>
      {layout === "centered" && content.image && (
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40" />
          <img 
            src={content.image}
            alt="Hero background"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="container mx-auto px-4 relative z-10">
        <div className={cn(
          "max-w-5xl mx-auto",
          layout === "split" ? "grid md:grid-cols-2 gap-12 items-center" : "text-center"
        )}>
          <div className={cn(
            "space-y-8",
            layout === "centered" && "text-white mx-auto max-w-3xl"
          )}>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              {content.title}
            </h1>
            <p className={cn(
              "text-xl md:text-2xl leading-relaxed",
              layout === "centered" ? "text-gray-100" : "text-gray-600"
            )}>
              {content.description}
            </p>
            <div className="pt-4">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg">
                {content.cta}
              </Button>
            </div>
          </div>
          
          {layout === "split" && content.image && (
            <div className="relative h-[500px] rounded-lg overflow-hidden shadow-2xl">
              <img 
                src={content.image}
                alt="Hero visual"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
