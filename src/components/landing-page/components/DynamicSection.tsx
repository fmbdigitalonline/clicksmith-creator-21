
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

  const contentClass = cn(
    "container mx-auto space-y-12",
    section.style?.textAlign === 'center' && "text-center",
    section.layout?.style === 'split' && "grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
  );

  const headingClass = cn(
    "font-bold leading-tight max-w-4xl mx-auto animate-fade-in",
    section.style?.typography?.headingSize === 'large' && "text-4xl md:text-5xl lg:text-6xl",
    section.style?.typography?.headingSize === 'xlarge' && "text-5xl md:text-6xl lg:text-7xl",
    "text-3xl md:text-4xl lg:text-5xl"
  );

  return (
    <section className={containerClass}>
      <div className={contentClass}>
        {section.content?.title && (
          <div className="space-y-4 text-center mb-12">
            <h2 className={headingClass}>{section.content.title}</h2>
            {section.content?.subtitle && (
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto animate-fade-in [animation-delay:200ms]">
                {section.content.subtitle}
              </p>
            )}
          </div>
        )}
        
        {section.content?.mainDescription && (
          <div className="max-w-3xl mx-auto animate-fade-in">
            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              {section.content.mainDescription}
            </p>
          </div>
        )}

        {section.content?.bulletPoints && <BulletPointsList points={section.content.bulletPoints} />}
        {section.content?.items && <FeatureGrid items={section.content.items} layout={section.layout} />}
        
        {(section.content?.primaryCta || section.content?.secondaryCta) && (
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12 animate-fade-in [animation-delay:400ms]">
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
    </section>
  );
};
