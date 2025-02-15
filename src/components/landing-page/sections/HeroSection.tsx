
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
      "relative py-16 md:py-24 border-b border-gray-100", // Added subtle border
      className
    )}>
      {/* Add background image when layout is centered */}
      {layout === "centered" && content.image && (
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-black/50" /> {/* Overlay */}
          <img 
            src={content.image}
            alt="Hero background"
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="container mx-auto px-4 relative z-10">
        <div className={cn(
          "grid gap-8",
          layout === "split" ? "md:grid-cols-2 items-center" : "text-center"
        )}>
          {/* Image for split layout - place it first in DOM but show second on desktop */}
          {layout === "split" && content.image && (
            <div className="order-2 md:order-1">
              <img 
                src={content.image}
                alt="Hero visual"
                className="w-full rounded-lg shadow-lg object-cover aspect-[4/3]"
              />
            </div>
          )}
          
          {/* Content section */}
          <div className={cn(
            "space-y-6",
            layout === "split" ? "order-1 md:order-2" : "mx-auto max-w-2xl",
            layout === "centered" && "text-white" // Add white text for centered layout
          )}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              {content.title}
            </h1>
            <p className={cn(
              "text-xl leading-relaxed",
              layout === "centered" ? "text-gray-100" : "text-gray-600"
            )}>
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
