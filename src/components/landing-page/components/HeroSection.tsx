
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowDown } from "lucide-react";

interface HeroSectionProps {
  content: {
    title: string;
    subtitle: string;
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
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              {content.title}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300">
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
                  variant="outline" 
                  size="lg" 
                  className="text-lg py-6 hover:scale-105 transition-all duration-200"
                >
                  {content.secondaryCta.text}
                </Button>
              )}
            </div>
          </div>
          <div className="relative h-[500px] rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-secondary/10 shadow-2xl animate-fade-in [animation-delay:200ms]" />
        </div>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ArrowDown className="h-6 w-6 text-primary" />
      </div>
    </section>
  );
};
