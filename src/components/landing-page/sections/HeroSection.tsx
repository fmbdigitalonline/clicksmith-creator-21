
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
  // First, log the content to debug
  console.log("Hero section content:", content);
  console.log("Hero layout:", layout);

  return (
    <section className={cn(
      "relative min-h-[600px] flex items-center py-16 md:py-24",
      "border-y border-gray-100",
      className
    )}>
      {/* Add background image when layout is centered */}
      {layout === "centered" && content.image && (
        <div className="absolute inset-0 z-0 border border-gray-100 rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-black/60" /> {/* Darkened overlay */}
          <img 
            src={content.image}
            alt="Hero background"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="container mx-auto px-4 relative z-10">
        <div className={cn(
          "grid gap-12",
          "p-6 rounded-xl",
          layout === "split" ? "md:grid-cols-2 items-center" : "text-center max-w-4xl mx-auto"
        )}>
          {/* Image for split layout - place it first in DOM but show second on desktop */}
          {layout === "split" && content.image && (
            <div className="order-2 md:order-1 border border-gray-100 rounded-lg overflow-hidden shadow-lg">
              <img 
                src={content.image}
                alt="Hero visual"
                className="w-full h-[500px] object-cover"
              />
            </div>
          )}
          
          {/* Content section */}
          <div className={cn(
            "space-y-8",
            layout === "split" ? "order-1 md:order-2" : "mx-auto",
            layout === "centered" && "text-white", // Add white text for centered layout
            layout === "split" && "p-6 border border-gray-100 rounded-lg bg-white/5 backdrop-blur-sm"
          )}>
            <h1 className={cn(
              "text-4xl md:text-5xl lg:text-6xl font-bold leading-tight",
              layout === "centered" && "max-w-3xl mx-auto"
            )}>
              {content.title}
            </h1>
            <p className={cn(
              "text-xl md:text-2xl leading-relaxed",
              layout === "centered" ? "text-gray-100 max-w-2xl mx-auto" : "text-gray-600"
            )}>
              {content.description}
            </p>
            <div className="pt-4">
              <Button size="lg" className="bg-facebook hover:bg-facebook/90 text-lg px-8 py-6 border border-white/10">
                {content.cta}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
