
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeSettings } from "@/types/landingPage";

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
  theme?: ThemeSettings;
}

export const HeroSection = ({ content, theme }: HeroSectionProps) => {
  const getThemeClasses = () => {
    if (!theme) return '';
    
    const classes = [
      theme.spacing?.sectionPadding || 'py-20',
      theme.style?.containerStyle === 'full' ? 'w-full' : 'container mx-auto'
    ];

    if (theme.colorScheme?.background) {
      classes.push(`bg-${theme.colorScheme.background}`);
    }

    return classes.join(' ');
  };

  const getHeadingClasses = () => {
    return cn(
      "text-4xl md:text-6xl font-bold leading-tight",
      theme?.typography?.scale?.h1,
      content.imageUrl && "text-white",
      theme?.colorScheme?.text && !content.imageUrl && `text-${theme.colorScheme.text}`
    );
  };

  const getSubtitleClasses = () => {
    return cn(
      "text-xl md:text-2xl",
      content.imageUrl ? "text-white/90" : "text-gray-600 dark:text-gray-300",
      theme?.typography?.scale?.h3,
      theme?.colorScheme?.muted && !content.imageUrl && `text-${theme.colorScheme.muted}`
    );
  };

  return (
    <section className={cn(
      "relative min-h-[80vh] flex items-center",
      !content.imageUrl && "bg-gradient-to-r from-primary/5 via-primary/10 to-secondary/5",
      getThemeClasses()
    )}>
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
      
      <div className={cn(
        "container mx-auto px-4 relative z-20",
        theme?.spacing?.containerWidth
      )}>
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <h1 className={getHeadingClasses()}>
              {content.title}
            </h1>
            <p className={getSubtitleClasses()}>
              {content.subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {content.primaryCta && (
                <Button 
                  size="lg" 
                  className={cn(
                    "text-lg py-6 group hover:scale-105 transition-all duration-200",
                    theme?.style?.borderRadius && `rounded-${theme.style.borderRadius}`
                  )}
                  style={{
                    backgroundColor: theme?.colorScheme?.primary,
                    color: theme?.colorScheme?.background || 'white'
                  }}
                >
                  {content.primaryCta.text}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              )}
              {content.secondaryCta && (
                <Button 
                  variant={content.imageUrl ? "secondary" : "outline"}
                  size="lg" 
                  className={cn(
                    "text-lg py-6 hover:scale-105 transition-all duration-200",
                    theme?.style?.borderRadius && `rounded-${theme.style.borderRadius}`
                  )}
                >
                  {content.secondaryCta.text}
                </Button>
              )}
            </div>
          </div>
          <div className={cn(
            "relative h-[500px] rounded-lg overflow-hidden",
            theme?.style?.shadowStrength === 'strong' && "shadow-2xl",
            theme?.style?.shadowStrength === 'medium' && "shadow-xl",
            theme?.style?.shadowStrength === 'light' && "shadow-md",
            "animate-fade-in [animation-delay:200ms]"
          )}>
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
          content.imageUrl ? "text-white" : theme?.colorScheme?.primary || "text-primary"
        )} />
      </div>
    </section>
  );
};

