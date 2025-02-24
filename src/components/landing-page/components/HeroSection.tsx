
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroSectionProps {
  content: {
    title: string;
    subtitle: string;
    imageUrl?: string;
    primaryCta?: {
      text: string;
      description?: string;
    };
    secondaryCta?: {
      text: string;
      description?: string;
    };
  };
}

export const HeroSection = ({ content }: HeroSectionProps) => {
  return (
    <section className="relative min-h-[80vh] flex items-center bg-gradient-to-r from-primary/5 via-primary/10 to-secondary/5 py-20">
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background/20 z-10" />
      {content.imageUrl && (
        <div className="absolute inset-0 z-0">
          <img 
            src={content.imageUrl} 
            alt="Hero background"
            className="w-full h-full object-cover animate-fade-in"
            loading="eager"
          />
        </div>
      )}
      
      <div className="container mx-auto px-4 relative z-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <h1 className={cn(
              "text-4xl md:text-6xl font-bold leading-tight",
              content.imageUrl && "text-white"
            )}>
              {content.title}
            </h1>
            <p className={cn(
              "text-xl md:text-2xl",
              content.imageUrl ? "text-white/90" : "text-gray-600 dark:text-gray-300"
            )}>
              {content.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {content.primaryCta && (
                <Button 
                  size="lg" 
                  className="text-lg py-6 group hover:scale-105 transition-all duration-200"
                >
                  {content.primaryCta.text}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              )}
              {content.secondaryCta && (
                <Button 
                  variant={content.imageUrl ? "secondary" : "outline"}
                  size="lg" 
                  className="text-lg py-6 hover:scale-105 transition-all duration-200"
                >
                  {content.secondaryCta.text}
                </Button>
              )}
            </div>
          </div>
          <div className="relative h-[500px] rounded-lg overflow-hidden shadow-2xl animate-fade-in [animation-delay:200ms]">
            {content.imageUrl ? (
              <img 
                src={content.imageUrl} 
                alt="Hero feature"
                className="w-full h-full object-cover"
                loading="eager"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/10 to-secondary/10" />
            )}
          </div>
        </div>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-20">
        <ArrowDown className={cn(
          "h-6 w-6",
          content.imageUrl ? "text-white" : "text-primary"
        )} />
      </div>
    </section>
  );
};
