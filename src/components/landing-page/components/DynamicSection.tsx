
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { BulletPointsList } from "./BulletPointsList";
import { FeatureGrid } from "./FeatureGrid";

interface DynamicSectionProps {
  section: any;
}

export const DynamicSection = ({ section }: DynamicSectionProps) => {
  if (!section) return null;

  const containerClass = cn(
    "w-full py-16 md:py-24",
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
    section.style?.typography?.headingSize === 'large' && "text-4xl md:text-5xl lg:text-6xl",
    section.style?.typography?.headingSize === 'xlarge' && "text-5xl md:text-6xl lg:text-7xl",
    "text-3xl md:text-4xl lg:text-5xl"
  );

  const isSplitLayout = section.layout?.style === 'split';
  const isColumnsLayout = section.layout?.style === 'columns';

  return (
    <section className={containerClass}>
      <div className="container mx-auto">
        {/* Header Content */}
        {(section.content?.title || section.content?.subtitle) && (
          <div className="space-y-6 text-center mb-16">
            {section.content?.title && (
              <h2 className={headingClass}>{section.content.title}</h2>
            )}
            {section.content?.subtitle && (
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto animate-fade-in [animation-delay:200ms]">
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
                    <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                      {section.content.mainDescription}
                    </p>
                  </div>
                )}
                {section.content?.bulletPoints && (
                  <BulletPointsList points={section.content.bulletPoints} />
                )}
              </div>

              {/* Image Content */}
              {section.content?.imageUrl && (
                <div className={cn(
                  "relative overflow-hidden rounded-xl shadow-xl",
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
              <FeatureGrid items={section.content.items} layout={section.layout} />
            </div>
          )}

          {/* Call to Action Buttons */}
          {(section.content?.primaryCta || section.content?.secondaryCta) && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in [animation-delay:400ms]">
              {section.content.primaryCta && (
                <div className="text-center">
                  <Button 
                    size="lg" 
                    className="min-w-[200px] text-lg py-6 group hover:scale-105 transition-all duration-200"
                  >
                    {section.content.primaryCta.text}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  {section.content.primaryCta.description && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
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
                    className="min-w-[200px] text-lg py-6 hover:scale-105 transition-all duration-200"
                  >
                    {section.content.secondaryCta.text}
                  </Button>
                  {section.content.secondaryCta.description && (
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
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
