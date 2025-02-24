
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { BulletPointsList } from "./BulletPointsList";
import { FeatureGrid } from "./FeatureGrid";
import { ThemeSettings } from "@/types/landingPage";

interface DynamicSectionProps {
  section: any;
  theme?: ThemeSettings;
}

export const DynamicSection = ({ section, theme }: DynamicSectionProps) => {
  if (!section) return null;

  const getThemeClasses = () => {
    if (!theme) return '';
    
    const classes = [
      theme.spacing?.sectionPadding || 'py-16 md:py-24',
      theme.style?.containerStyle === 'full' ? 'w-full' : 'container mx-auto'
    ];

    if (theme.colorScheme?.background) {
      classes.push(`bg-${theme.colorScheme.background}`);
    }

    return classes.join(' ');
  };

  const containerClass = cn(
    "w-full",
    getThemeClasses(),
    section.layout?.width === 'contained' && "px-4 md:px-6",
    section.layout?.width === 'narrow' && "max-w-4xl mx-auto px-4",
    section.layout?.spacing === 'compact' && "py-12 md:py-16",
    section.layout?.spacing === 'spacious' && "py-20 md:py-32",
    section.layout?.background === 'gradient' && "bg-gradient-to-r from-primary/5 via-primary/10 to-secondary/5",
    section.style?.colorScheme === 'dark' && "bg-gray-900 text-white",
    section.style?.colorScheme === 'light' && "bg-white text-gray-900"
  );

  const headingClass = cn(
    "font-bold leading-tight animate-fade-in",
    theme?.typography?.scale?.h2 || "text-3xl md:text-4xl lg:text-5xl",
    section.style?.typography?.headingSize === 'large' && "text-4xl md:text-5xl lg:text-6xl",
    section.style?.typography?.headingSize === 'xlarge' && "text-5xl md:text-6xl lg:text-7xl",
    theme?.colorScheme?.text && `text-${theme.colorScheme.text}`
  );

  const isSplitLayout = section.layout?.style === 'split';
  const isColumnsLayout = section.layout?.style === 'columns';

  return (
    <section className={containerClass}>
      <div className={cn(
        "container mx-auto",
        theme?.spacing?.containerWidth
      )}>
        {/* Header Content */}
        {(section.content?.title || section.content?.subtitle) && (
          <div className="space-y-6 text-center mb-16">
            {section.content?.title && (
              <h2 className={headingClass}>{section.content.title}</h2>
            )}
            {section.content?.subtitle && (
              <p className={cn(
                "text-xl md:text-2xl max-w-3xl mx-auto animate-fade-in [animation-delay:200ms]",
                theme?.typography?.scale?.h3,
                theme?.colorScheme?.muted ? `text-${theme.colorScheme.muted}` : "text-gray-600 dark:text-gray-300"
              )}>
                {section.content.subtitle}
              </p>
            )}
          </div>
        )}

        {/* Main Content Area */}
        <div className="space-y-16">
          {/* Text and Image Content */}
          {(section.content?.mainDescription || section.content?.bulletPoints || section.content?.imageUrl) && (
            <div className={cn(
              "w-full gap-8 md:gap-12",
              isSplitLayout && "grid md:grid-cols-2 items-center",
              isColumnsLayout && "grid grid-cols-1 md:grid-cols-12 items-start",
              !isSplitLayout && !isColumnsLayout && "space-y-8"
            )}>
              {/* Text Content */}
              <div className={cn(
                "space-y-8",
                isColumnsLayout && "md:col-span-7",
                !isColumnsLayout && !isSplitLayout && "max-w-3xl mx-auto"
              )}>
                {section.content?.mainDescription && (
                  <div className="animate-fade-in">
                    <p className={cn(
                      "text-xl leading-relaxed",
                      theme?.colorScheme?.text ? `text-${theme.colorScheme.text}` : "text-gray-600 dark:text-gray-300"
                    )}>
                      {section.content.mainDescription}
                    </p>
                  </div>
                )}
                {section.content?.bulletPoints && (
                  <BulletPointsList points={section.content.bulletPoints} theme={theme} />
                )}
              </div>

              {/* Image Content */}
              {section.content?.imageUrl && (
                <div className={cn(
                  "relative overflow-hidden",
                  theme?.style?.borderRadius && `rounded-${theme.style.borderRadius}`,
                  theme?.style?.shadowStrength === 'strong' && "shadow-2xl",
                  theme?.style?.shadowStrength === 'medium' && "shadow-xl",
                  theme?.style?.shadowStrength === 'light' && "shadow-md",
                  isSplitLayout && "h-[400px]",
                  isColumnsLayout && "md:col-span-5 aspect-[4/3]",
                  !isSplitLayout && !isColumnsLayout && "aspect-video max-w-4xl mx-auto"
                )}>
                  <img 
                    src={section.content.imageUrl} 
                    alt={section.content.title || "Section image"}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          )}

          {/* Feature Grid */}
          {section.content?.items && (
            <div className={cn(!section.content?.mainDescription && "mt-0")}>
              <FeatureGrid items={section.content.items} layout={section.layout} theme={theme} />
            </div>
          )}

          {/* Call to Action Buttons */}
          {(section.content?.primaryCta || section.content?.secondaryCta) && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in [animation-delay:400ms]">
              {section.content.primaryCta && (
                <div className="text-center">
                  <Button 
                    size="lg" 
                    className={cn(
                      "min-w-[200px] text-lg py-6 group hover:scale-105 transition-all duration-200",
                      theme?.style?.borderRadius && `rounded-${theme.style.borderRadius}`
                    )}
                    style={{
                      backgroundColor: theme?.colorScheme?.primary,
                      color: theme?.colorScheme?.background || 'white'
                    }}
                  >
                    {section.content.primaryCta.text}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  {section.content.primaryCta.description && (
                    <p className={cn(
                      "mt-2 text-sm",
                      theme?.colorScheme?.muted ? `text-${theme.colorScheme.muted}` : "text-gray-600 dark:text-gray-400"
                    )}>
                      {section.content.primaryCta.description}
                    </p>
                  )}
                </div>
              )}
              {section.content.secondaryCta && (
                <div className="text-center">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className={cn(
                      "min-w-[200px] text-lg py-6 hover:scale-105 transition-all duration-200",
                      theme?.style?.borderRadius && `rounded-${theme.style.borderRadius}`
                    )}
                  >
                    {section.content.secondaryCta.text}
                  </Button>
                  {section.content.secondaryCta.description && (
                    <p className={cn(
                      "mt-2 text-sm",
                      theme?.colorScheme?.muted ? `text-${theme.colorScheme.muted}` : "text-gray-600 dark:text-gray-400"
                    )}>
                      {section.content.secondaryCta.description}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

